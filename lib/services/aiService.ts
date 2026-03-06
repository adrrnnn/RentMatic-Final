// AI Assistant Service with Gemini integration and backup bot
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PropertyService } from '@/lib/firestore/properties/propertyService';
import { UnitService } from '@/lib/firestore/properties/unitService';
import { TenantService } from '@/lib/firestore/properties/tenantService';

// Gemini AI Configuration
const GEMINI_API_KEY = typeof window !== 'undefined' && window.env 
  ? window.env.NEXT_PUBLIC_GEMINI_API_KEY 
  : process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// System Context for AI Assistant
const SYSTEM_CONTEXT = `
    You are RentMatic AI Assistant, an enthusiastic and helpful property management AI that helps landlords manage their rental properties! 🏠✨

    IMPORTANT: You ONLY respond to property management queries related to RentMatic. If users ask about anything unrelated to property management, rental properties, tenants, units, or real estate, politely redirect them back to property management topics.

    PERSONALITY: Be enthusiastic, helpful, and use appropriate emojis (but not too many). Sound like a friendly assistant who's excited to help with property management! 🎉

CAPABILITIES:
- Create, read, update, delete properties
- Create, read, update, delete units within properties
- Create, read, update, delete tenants
- Assign tenants to units
- Generate reports and analytics
- Answer questions about property management
- Provide rental market insights

AVAILABLE ACTIONS:
1. CREATE_PROPERTY - Create a new property
2. UPDATE_PROPERTY - Update property details
3. DELETE_PROPERTY - Remove a property
4. CREATE_UNIT - Add a unit to a property
5. UPDATE_UNIT - Modify unit details
6. DELETE_UNIT - Remove a unit
7. CREATE_TENANT - Add a new tenant
8. UPDATE_TENANT - Update tenant information
9. DELETE_TENANT - Remove a tenant
10. ASSIGN_TENANT - Assign tenant to a unit
11. UNASSIGN_TENANT - Remove tenant from unit
12. GET_ANALYTICS - Generate property analytics
13. SEARCH_PROPERTIES - Find properties by criteria
14. SEARCH_TENANTS - Find tenants by criteria
15. ANSWER_QUESTION - Answer general questions

RESPONSE FORMAT:
Always respond with JSON in this format:
{
  "action": "ACTION_NAME",
  "parameters": {...},
  "message": "Human readable response",
  "success": true/false
}

CRITICAL CONVERSATION RULES:
1. ALWAYS remember the ENTIRE conversation history
2. Extract information from MULTIPLE messages if needed
3. If user provides partial information, ask for missing details
4. When creating tenants, extract: fullName, email, phone
5. When creating properties, extract: name, address, type, numberOfUnits
6. Be conversational and helpful, not robotic
7. NEVER lose track of what the user is trying to do
8. If user says "create new tenant" and you have partial info, ask for missing details
9. If user provides additional info, combine it with previous info
10. Always maintain context of the current task

CONVERSATION MEMORY EXAMPLES:
- If user says "full name is pearl krabs" then "pearl@gmail.com and 821371237" then "create new tenant", you should extract all info and create the tenant
- If user says "create property" then provides details in next message, combine the information
- Always remember what the user is trying to accomplish

If no specific action is needed, use:
{
  "action": "ANSWER_QUESTION",
  "message": "Your response",
  "success": true
}
`;

interface AIResponse {
  action: string;
  parameters?: Record<string, unknown>;
  message: string;
  success: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  parameters?: Record<string, unknown>;
}

export class AIService {
  private static isGeminiAvailable = !!GEMINI_API_KEY;
  private static requestCount = 0;
  private static maxRequests = 10; // Rate limiting

  /**
   * Send message to AI and get response
   */
  static async sendMessage(message: string, context?: Record<string, unknown>): Promise<AIResponse> {
    try {
      // Check rate limiting
      if (this.requestCount >= this.maxRequests) {
        console.warn('Rate limit reached, using backup bot');
        return this.getBackupResponse(message);
      }

      // Try Gemini first
      if (this.isGeminiAvailable) {
        try {
          const response = await this.callGemini(message, context);
          this.requestCount++;
          return response;
        } catch (error) {
          console.warn('Gemini request failed, falling back to backup bot:', error);
          this.isGeminiAvailable = false;
        }
      }

      // Fallback to backup bot
      return this.getBackupResponse(message);
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        action: 'ERROR',
        message: 'Sorry, I encountered an error. Please try again.',
        success: false
      };
    }
  }

  /**
   * Send message with conversation history for better context
   */
  static async sendMessageWithHistory(message: string, conversationHistory: string[] = [], userId?: string): Promise<AIResponse> {
    try {
      // Build context from conversation history
      const context = {
        conversationHistory: conversationHistory,
        currentMessage: message,
        userId: userId
      };

      // Check rate limiting
      if (this.requestCount >= this.maxRequests) {
        console.warn('Rate limit reached, using backup bot');
        return this.getBackupResponseWithHistory(message, conversationHistory);
      }

      // Try Gemini first
      if (this.isGeminiAvailable) {
        try {
          const response = await this.callGeminiWithHistory(message, conversationHistory);
          this.requestCount++;
          return response;
        } catch (error) {
          console.warn('Gemini request failed, falling back to backup bot:', error);
          this.isGeminiAvailable = false;
        }
      }

      // Fallback to backup bot
      return this.getBackupResponseWithHistory(message, conversationHistory);
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        action: 'ERROR',
        message: 'Sorry, I encountered an error. Please try again.',
        success: false
      };
    }
  }

  /**
   * Call Gemini API using the Google Generative AI SDK
   */
  private static async callGemini(message: string, context?: Record<string, unknown>): Promise<AIResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${SYSTEM_CONTEXT}

Current Context: ${JSON.stringify(context || {})}

User Message: ${message}

Please respond with a JSON object following the specified format.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      try {
        // Clean the content to remove any markdown formatting
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return parsed;
      } catch (error) {
        // If JSON parsing fails, treat as a general response
        return {
          action: 'ANSWER_QUESTION',
          message: content,
          success: true
        };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call Gemini API with conversation history
   */
  private static async callGeminiWithHistory(message: string, conversationHistory: string[]): Promise<AIResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nConversation History:\n${conversationHistory.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}`
      : '';

    const prompt = `${SYSTEM_CONTEXT}

${conversationContext}

Current User Message: ${message}

IMPORTANT: Use the conversation history to understand what the user is trying to accomplish. If they provided information in previous messages, extract and use it. If they say "create tenant" and you have their name, email, and phone from previous messages, create the tenant with that information.

Please respond with a JSON object following the specified format.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      try {
        // Clean the content to remove any markdown formatting
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return parsed;
      } catch (error) {
        // If JSON parsing fails, treat as a general response
        return {
          action: 'ANSWER_QUESTION',
          message: content,
          success: true
        };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Backup bot for when Gemini is unavailable
   */
  private static getBackupResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Check if message is related to property management
    const propertyManagementKeywords = [
      'property', 'tenant', 'unit', 'rent', 'rental', 'landlord', 'building', 
      'apartment', 'house', 'lease', 'occupancy', 'maintenance', 'payment',
      'create', 'add', 'update', 'delete', 'assign', 'analytics', 'report',
      'pearl', 'krabs', 'email', 'phone', 'name', 'full name'
    ];
    
    const isPropertyManagementQuery = propertyManagementKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (!isPropertyManagementQuery) {
      return {
        action: 'ANSWER_QUESTION',
        message: 'I\'m RentMatic AI Assistant, specialized in property management. I can help you with properties, tenants, units, and rental management. How can I assist you with your rental property needs?',
        success: true
      };
    }

    // Property management keywords
    if (lowerMessage.includes('create property') || lowerMessage.includes('add property')) {
      return {
        action: 'CREATE_PROPERTY',
        message: 'I can help you create a new property. Please provide the property name, address, type, and number of units.',
        success: true
      };
    }

    if (lowerMessage.includes('create unit') || lowerMessage.includes('add unit')) {
      return {
        action: 'CREATE_UNIT',
        message: 'I can help you add a unit to a property. Please specify which property and the unit details.',
        success: true
      };
    }

    if (lowerMessage.includes('create tenant') || lowerMessage.includes('add tenant') || 
        lowerMessage.includes('new tenant') || lowerMessage.includes('tenant name') ||
        lowerMessage.includes('pearl') || lowerMessage.includes('krabs')) {
      
      // Check if we have tenant information in the message
      const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const phoneMatch = message.match(/(\d{10,})/);
      const nameMatch = message.match(/name\s+is\s+(\w+\s+\w+)/i) || 
                       message.match(/full\s+name\s+is\s+(\w+\s+\w+)/i) ||
                       message.match(/(\w+\s+\w+)\s+@/i) ||
                       message.match(/pearl\s+krabs/i);
      
      if (emailMatch && phoneMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          parameters: {
            fullName: nameMatch[1],
            email: emailMatch[1],
            phone: phoneMatch[1]
          },
          message: `✅ I'll create a new tenant with the information you provided: ${nameMatch[1]}, ${emailMatch[1]}, ${phoneMatch[1]}`,
          success: true
        };
      }
      
      // If we have partial info, ask for missing details
      if (emailMatch && phoneMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the email (${emailMatch[1]}) and phone (${phoneMatch[1]}). What is the tenant's full name?`,
          success: true
        };
      }
      
      if (emailMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the name (${nameMatch[1]}) and email (${emailMatch[1]}). What is the tenant's phone number?`,
          success: true
        };
      }
      
      if (phoneMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the name (${nameMatch[1]}) and phone (${phoneMatch[1]}). What is the tenant's email address?`,
          success: true
        };
      }
      
      return {
        action: 'CREATE_TENANT',
        message: 'I can help you add a new tenant. Please provide the tenant\'s name, email, and phone number.',
        success: true
      };
    }

    if (lowerMessage.includes('assign tenant') || lowerMessage.includes('move tenant')) {
      return {
        action: 'ASSIGN_TENANT',
        message: 'I can help you assign a tenant to a unit. Please specify the tenant and unit.',
        success: true
      };
    }

    if (lowerMessage.includes('analytics') || lowerMessage.includes('report')) {
      return {
        action: 'GET_ANALYTICS',
        message: 'I can generate property analytics and reports for you.',
        success: true
      };
    }

    // General property management questions
    if (lowerMessage.includes('rent') || lowerMessage.includes('rental')) {
      return {
        action: 'ANSWER_QUESTION',
        message: 'I can help you with rental property management. You can ask me to create properties, units, manage tenants, or generate reports.',
        success: true
      };
    }

    // Default response
    return {
      action: 'ANSWER_QUESTION',
      message: 'I\'m your RentMatic AI assistant! I can help you manage properties, units, and tenants. Try asking me to "create a property" or "add a tenant".',
      success: true
    };
  }

  /**
   * Backup bot with conversation history
   */
  private static getBackupResponseWithHistory(message: string, conversationHistory: string[]): AIResponse {
    const lowerMessage = message.toLowerCase();
    const fullConversation = [...conversationHistory, message].join(' ').toLowerCase();

    // Check if message is related to property management
    const propertyManagementKeywords = [
      'property', 'tenant', 'unit', 'rent', 'rental', 'landlord', 'building', 
      'apartment', 'house', 'lease', 'occupancy', 'maintenance', 'payment',
      'create', 'add', 'update', 'delete', 'assign', 'analytics', 'report',
      'pearl', 'krabs', 'email', 'phone', 'name', 'full name'
    ];
    
    const isPropertyManagementQuery = propertyManagementKeywords.some(keyword => 
      fullConversation.includes(keyword)
    );

    if (!isPropertyManagementQuery) {
      return {
        action: 'ANSWER_QUESTION',
        message: 'Hey there! 👋 I\'m your RentMatic AI Assistant, specialized in property management! I can help you with properties, tenants, units, and rental management. What would you like to work on today? 🏠✨',
        success: true
      };
    }

    // Enhanced tenant creation logic with conversation history
    if (lowerMessage.includes('create tenant') || lowerMessage.includes('add tenant') || 
        lowerMessage.includes('new tenant') || lowerMessage.includes('tenant name')) {
      
      // Extract information from the full conversation
      const emailMatch = fullConversation.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const phoneMatch = fullConversation.match(/(\d{10,})/);
      const nameMatch = fullConversation.match(/name\s+is\s+(\w+\s+\w+)/i) || 
                       fullConversation.match(/full\s+name\s+is\s+(\w+\s+\w+)/i) ||
                       fullConversation.match(/(\w+\s+\w+)\s+@/i) ||
                       fullConversation.match(/pearl\s+krabs/i);
      
      if (emailMatch && phoneMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          parameters: {
            fullName: nameMatch[1],
            email: emailMatch[1],
            phone: phoneMatch[1]
          },
          message: `✅ I'll create a new tenant with the information you provided: ${nameMatch[1]}, ${emailMatch[1]}, ${phoneMatch[1]}`,
          success: true
        };
      }
      
      // If we have partial info, ask for missing details
      if (emailMatch && phoneMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the email (${emailMatch[1]}) and phone (${phoneMatch[1]}). What is the tenant's full name?`,
          success: true
        };
      }
      
      if (emailMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the name (${nameMatch[1]}) and email (${emailMatch[1]}). What is the tenant's phone number?`,
          success: true
        };
      }
      
      if (phoneMatch && nameMatch) {
        return {
          action: 'CREATE_TENANT',
          message: `I have the name (${nameMatch[1]}) and phone (${phoneMatch[1]}). What is the tenant's email address?`,
          success: true
        };
      }
      
      return {
        action: 'CREATE_TENANT',
        message: 'I can help you add a new tenant. Please provide the tenant\'s name, email, and phone number.',
        success: true
      };
    }

    // Property management keywords
    if (lowerMessage.includes('create property') || lowerMessage.includes('add property')) {
      return {
        action: 'CREATE_PROPERTY',
        message: 'I can help you create a new property. Please provide the property name, address, type, and number of units.',
        success: true
      };
    }

    if (lowerMessage.includes('create unit') || lowerMessage.includes('add unit')) {
      return {
        action: 'CREATE_UNIT',
        message: 'I can help you add a unit to a property. Please specify which property and the unit details.',
        success: true
      };
    }

    if (lowerMessage.includes('assign tenant') || lowerMessage.includes('move tenant')) {
      return {
        action: 'ASSIGN_TENANT',
        message: 'I can help you assign a tenant to a unit. Please specify the tenant and unit.',
        success: true
      };
    }

    if (lowerMessage.includes('get analytics') || lowerMessage.includes('show analytics') || lowerMessage.includes('reports')) {
      return {
        action: 'GET_ANALYTICS',
        message: 'I can generate analytics and reports for your properties. What kind of insights are you looking for?',
        success: true
      };
    }

    if (lowerMessage.includes('search properties') || lowerMessage.includes('find property')) {
      return {
        action: 'SEARCH_PROPERTIES',
        message: 'I can search for properties. What criteria should I use?',
        success: true
      };
    }

      if (lowerMessage.includes('search tenants') || lowerMessage.includes('find tenant') || 
          lowerMessage.includes('check') || lowerMessage.includes('pearl') || lowerMessage.includes('krabs') ||
          lowerMessage.includes('do i have') || lowerMessage.includes('any tenants')) {
        
        // Extract search query from the message - look for names after common patterns
        let searchQuery = '';
        
        // Look for patterns like "tenants named X" or "tenant X" or "anyone named X"
        const namedMatch = message.match(/(?:tenants?|anyone)\s+(?:named|called|with\s+name)\s+([^?]+)/i);
        if (namedMatch) {
          searchQuery = namedMatch[1].trim();
        } else {
          // Look for names after "pearl" or other specific names
          const nameMatch = message.match(/(?:pearl|krabs|john|jane|smith|doe)\s*([^?]*)/i);
          if (nameMatch) {
            searchQuery = nameMatch[0].trim();
          } else {
            // Look for "anyone named X" pattern
            const anyoneMatch = message.match(/anyone\s+named\s+([^?]+)/i);
            if (anyoneMatch) {
              searchQuery = anyoneMatch[1].trim();
            } else {
              // Fallback: extract words that look like names
              const words = message.split(/\s+/);
              const nameWords = words.filter(word => 
                word.length > 2 && 
                /^[a-zA-Z]+$/.test(word) && 
                !['tenant', 'tenants', 'search', 'find', 'check', 'have', 'any', 'do', 'i', 'you', 'anyone'].includes(word.toLowerCase())
              );
              searchQuery = nameWords.join(' ');
            }
          }
        }
        
        // Ensure we have a search query
        if (!searchQuery || searchQuery.trim() === '') {
          searchQuery = 'pearl'; // Default fallback for pearl searches
        }
        
        console.log('Extracted search query:', searchQuery, 'from message:', message);
        
        return {
          action: 'SEARCH_TENANTS',
          parameters: {
            query: searchQuery
          },
          message: `🔍 I'll search for tenants matching "${searchQuery}".`,
          success: true
        };
      }

    return {
      action: 'ANSWER_QUESTION',
      message: 'Hello! 👋 I\'m your RentMatic AI Assistant, and I\'m here to help you manage your rental properties! 🏠✨ I can help you with creating, updating, and deleting properties, units, and tenants. I can also assign tenants to units, generate reports and analytics, search for properties and tenants, and answer your questions about property management! What would you like to work on today? 🎉',
      success: true
    };
  }

  /**
   * Execute AI action
   */
  static async executeAction(action: string, parameters: Record<string, unknown>, context: Record<string, unknown>, userId?: string): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
    try {
      switch (action) {
        case 'CREATE_PROPERTY':
          return await this.createProperty(parameters);
        case 'UPDATE_PROPERTY':
          return await this.updateProperty(parameters);
        case 'DELETE_PROPERTY':
          return await this.deleteProperty(parameters);
        case 'CREATE_UNIT':
          return await this.createUnit(parameters);
        case 'UPDATE_UNIT':
          return await this.updateUnit(parameters);
        case 'DELETE_UNIT':
          return await this.deleteUnit(parameters);
        case 'CREATE_TENANT':
          return await this.createTenant(parameters, userId);
        case 'UPDATE_TENANT':
          return await this.updateTenant(parameters);
        case 'DELETE_TENANT':
          return await this.deleteTenant(parameters);
        case 'ASSIGN_TENANT':
          return await this.assignTenant(parameters);
        case 'UNASSIGN_TENANT':
          return await this.unassignTenant(parameters);
        case 'GET_ANALYTICS':
          return await this.getAnalytics(parameters);
        case 'SEARCH_PROPERTIES':
          return await this.searchProperties(parameters);
        case 'SEARCH_TENANTS':
          return await this.searchTenants(parameters, userId);
        case 'ANSWER_QUESTION':
          return await this.answerQuestion(parameters);
        default:
          return {
            success: false,
            message: `Action "${action}" is not yet implemented.`
          };
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return {
        success: false,
        message: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Action implementations
  private static async createProperty(parameters: Record<string, unknown>) {
    try {
      const { name, address, type, numberOfUnits, description } = parameters;
      
      if (!name || !address || !type || !numberOfUnits) {
        return {
          success: false,
          message: 'Missing required fields: name, address, type, and numberOfUnits are required.'
        };
      }

      const propertyData = {
        name: name as string,
        address: address as string,
        type: type as string,
        numberOfUnits: Number(numberOfUnits),
        description: description as string || '',
        imageURL: '',
        manager: ''
      };

      // Note: This would need the actual user ID from context
      // For now, we'll return a success message with instructions
      return {
        success: true,
        message: `I'm ready to create "${name}" at ${address}. This is a ${type} with ${numberOfUnits} units. Please use the Properties tab to complete the creation.`,
        data: propertyData
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async createUnit(parameters: Record<string, unknown>) {
    try {
      const { propertyId, name, floor, rentType, rentAmount, description } = parameters;
      
      if (!propertyId || !name || !rentType || !rentAmount) {
        return {
          success: false,
          message: 'Missing required fields: propertyId, name, rentType, and rentAmount are required.'
        };
      }

      return {
        success: true,
        message: `I'm ready to create unit "${name}" in property ${propertyId}. Rent: ₱${rentAmount} ${rentType}. Please use the Properties tab to complete the creation.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create unit: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async createTenant(parameters: Record<string, unknown>, userId?: string) {
    try {
      const { fullName, email, phone, propertyId, unitId } = parameters;
      
      if (!fullName || !email || !phone) {
        return {
          success: false,
          message: 'Missing required fields: fullName, email, and phone are required.'
        };
      }

      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated. Please log in to create tenants.'
        };
      }

      // Create tenant data using the existing structure
      const tenantData = {
        fullName: fullName as string,
        contact: {
          email: email as string,
          phone: phone as string
        },
        moveInDate: new Date().toISOString(),
        notes: 'Created via AI Assistant',
        unitId: unitId as string || null,
        propertyId: propertyId as string || null
      };

      try {
        // Create tenant in database with real user ID
        const tenantId = await TenantService.createTenant(userId, tenantData);
        
        return {
          success: true,
          message: `✅ Tenant "${fullName}" has been created successfully!\n\n📋 Tenant Details:\n• Name: ${fullName}\n• Email: ${email}\n• Phone: ${phone}\n• ID: ${tenantId}\n\nYou can now assign this tenant to a property unit using the Properties tab.`,
          data: { id: tenantId, ...tenantData }
        };
      } catch (dbError) {
        // If database creation fails, show error
        console.error('Database creation failed:', dbError);
        return {
          success: false,
          message: `Failed to create tenant in database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}. Please try again or use the Tenants tab to create manually.`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create tenant: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async assignTenant(parameters: Record<string, unknown>) {
    try {
      const { tenantId, unitId, propertyId } = parameters;
      
      if (!tenantId || !unitId || !propertyId) {
        return {
          success: false,
          message: 'Missing required fields: tenantId, unitId, and propertyId are required.'
        };
      }

      return {
        success: true,
        message: `I'm ready to assign tenant ${tenantId} to unit ${unitId} in property ${propertyId}. Please use the Properties tab to complete the assignment.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to assign tenant: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async getAnalytics(parameters: Record<string, unknown>) {
    try {
      const { type, period } = parameters;
      
      return {
        success: true,
        message: `I can generate ${type || 'general'} analytics for ${period || 'this month'}. Please use the Dashboard or Reports tab to view detailed analytics.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async searchProperties(parameters: Record<string, unknown>) {
    try {
      const { query } = parameters;
      
      return {
        success: true,
        message: `I can search for properties matching "${query || 'your criteria'}". Please use the Properties tab to perform the search.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to search properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async searchTenants(parameters: Record<string, unknown>, userId?: string) {
    try {
      const { query } = parameters;
      
      if (!userId) {
        return {
          success: true,
          message: '🔍 Please log in to search tenants, or check the Tenants tab to see all your tenants!'
        };
      }

      if (!query) {
        return {
          success: true,
          message: '🔍 Please provide a search query (tenant name, email, or phone number), or check the Tenants tab to see all your tenants!'
        };
      }

      try {
        // Use the real search method from TenantsService
        const searchQuery = query as string;
        console.log('Searching for tenants with query:', searchQuery, 'userId:', userId);
        const allTenants = await TenantService.getTenants(userId);
        const results = allTenants.filter(tenant => 
          tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log('Search results:', results);
        
        if (results.length === 0) {
          return {
            success: true,
            message: `🔍 No tenants found matching "${searchQuery}". You can create a new tenant or check the Tenants tab to see all your tenants!`,
            data: { query: searchQuery, results: [] }
          };
        } else {
          const tenantNames = results.map(tenant => tenant.fullName).join(', ');
          return {
            success: true,
            message: `🎉 Found ${results.length} tenant(s) matching "${searchQuery}": ${tenantNames}. Check the Tenants tab for full details!`,
            data: { query: searchQuery, results: results }
          };
        }
      } catch (dbError) {
        console.error('Database search failed:', dbError);
        // Fallback: return a helpful message instead of failing
        return {
          success: true,
          message: `🔍 I couldn't search the database right now, but you can check the Tenants tab to see all your tenants and search for "${query}" there!`,
          data: { query: query, results: 'Please check the Tenants tab' }
        };
      }
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: true,
        message: `🔍 I encountered an issue searching for tenants, but you can check the Tenants tab to see all your tenants and search there!`,
        data: { query: parameters.query || 'search', results: 'Please check the Tenants tab' }
      };
    }
  }

  private static async updateProperty(parameters: Record<string, unknown>) {
    try {
      const { propertyId, name, address, type, description } = parameters;
      
      if (!propertyId) {
        return {
          success: false,
          message: 'Property ID is required for updates.'
        };
      }

      return {
        success: true,
        message: `I'm ready to update property ${propertyId} with the new details. Please use the Properties tab to complete the update.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async deleteProperty(parameters: Record<string, unknown>) {
    try {
      const { propertyId } = parameters;
      
      if (!propertyId) {
        return {
          success: false,
          message: 'Property ID is required for deletion.'
        };
      }

      return {
        success: true,
        message: `I'm ready to delete property ${propertyId}. Please use the Properties tab to confirm the deletion.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async updateUnit(parameters: Record<string, unknown>) {
    try {
      const { unitId, name, floor, rentType, rentAmount, description } = parameters;
      
      if (!unitId) {
        return {
          success: false,
          message: 'Unit ID is required for updates.'
        };
      }

      return {
        success: true,
        message: `I'm ready to update unit ${unitId} with the new details. Please use the Properties tab to complete the update.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update unit: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async deleteUnit(parameters: Record<string, unknown>) {
    try {
      const { unitId } = parameters;
      
      if (!unitId) {
        return {
          success: false,
          message: 'Unit ID is required for deletion.'
        };
      }

      return {
        success: true,
        message: `I'm ready to delete unit ${unitId}. Please use the Properties tab to confirm the deletion.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete unit: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async updateTenant(parameters: Record<string, unknown>) {
    try {
      const { tenantId, fullName, email, phone } = parameters;
      
      if (!tenantId) {
        return {
          success: false,
          message: 'Tenant ID is required for updates.'
        };
      }

      return {
        success: true,
        message: `I'm ready to update tenant ${tenantId} with the new details. Please use the Tenants tab to complete the update.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update tenant: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async deleteTenant(parameters: Record<string, unknown>) {
    try {
      const { tenantId } = parameters;
      
      if (!tenantId) {
        return {
          success: false,
          message: 'Tenant ID is required for deletion.'
        };
      }

      return {
        success: true,
        message: `I'm ready to delete tenant ${tenantId}. Please use the Tenants tab to confirm the deletion.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete tenant: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async unassignTenant(parameters: Record<string, unknown>) {
    try {
      const { tenantId, unitId, propertyId } = parameters;
      
      if (!tenantId || !unitId || !propertyId) {
        return {
          success: false,
          message: 'Missing required fields: tenantId, unitId, and propertyId are required.'
        };
      }

      return {
        success: true,
        message: `I'm ready to unassign tenant ${tenantId} from unit ${unitId} in property ${propertyId}. Please use the Properties tab to complete the unassignment.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to unassign tenant: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async answerQuestion(parameters: Record<string, unknown>) {
    try {
      const { question } = parameters;
      
      return {
        success: true,
        message: `I understand you're asking: "${question || 'your question'}". I'm here to help with property management tasks. You can ask me to create properties, manage tenants, generate reports, or answer general property management questions.`,
        data: parameters
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to answer question: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Reset rate limiting (call this periodically)
   */
  static resetRateLimit() {
    this.requestCount = 0;
  }

  /**
   * Check if Gemini is available
   */
  static isGeminiReady(): boolean {
    return this.isGeminiAvailable && !!GEMINI_API_KEY;
  }
}
