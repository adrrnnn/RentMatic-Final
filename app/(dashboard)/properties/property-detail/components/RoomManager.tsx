"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, Camera, Home, Bed, Bath, ChefHat, Sofa, Utensils, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import type { Room } from "@/types/firestore";

interface RoomManagerProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
}

const roomTypeIcons = {
  bedroom: Bed,
  bathroom: Bath,
  living_room: Sofa,
  kitchen: ChefHat,
  dining_room: Utensils,
  balcony: Sun,
  other: Home,
};

const roomTypeLabels = {
  bedroom: "Bedroom",
  bathroom: "Bathroom", 
  living_room: "Living Room",
  kitchen: "Kitchen",
  dining_room: "Dining Room",
  balcony: "Balcony",
  other: "Other",
};

export function RoomManager({ rooms, onRoomsChange }: RoomManagerProps) {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: "",
    type: "bedroom", // Default to bedroom
    description: "",
    imageURL: undefined,
  });

  const handleAddRoom = () => {
    console.log("handleAddRoom called with newRoom:", newRoom);
    
    // Generate room name based on type
    let roomName = "";
    if (newRoom.type === "other") {
      // For "other" type, use the manually entered name
      if (!newRoom.name?.trim()) {
        console.log("Room name is empty for 'other' type, not adding room");
        return;
      }
      roomName = newRoom.name.trim();
    } else {
      // For predefined types, auto-generate name with numbering
      const roomTypeLabels = {
        bedroom: "Bedroom",
        bathroom: "Bathroom", 
        living_room: "Living Room",
        kitchen: "Kitchen",
        dining_room: "Dining Room",
        balcony: "Balcony"
      };
      
      const baseName = roomTypeLabels[newRoom.type as keyof typeof roomTypeLabels] || "Room";
      
      // Count existing rooms of the same type
      const sameTypeRooms = rooms.filter(room => room.type === newRoom.type);
      const roomNumber = sameTypeRooms.length + 1;
      
      roomName = roomNumber === 1 ? baseName : `${baseName} ${roomNumber}`;
    }

    const room: Room = {
      id: Date.now().toString(),
      name: roomName,
      type: newRoom.type || "bedroom",
      description: newRoom.description || "",
      imageURL: newRoom.imageURL,
    };

    console.log("Adding room:", room);
    onRoomsChange([...rooms, room]);
    setNewRoom({ name: "", type: "bedroom", description: "", imageURL: undefined });
    setShowAddRoom(false);
    console.log("Room added successfully");
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom(room);
    setShowAddRoom(true);
  };

  const handleUpdateRoom = () => {
    if (!editingRoom || !newRoom.name?.trim()) return;

    const updatedRooms = rooms.map(room =>
      room.id === editingRoom.id
        ? { ...room, ...newRoom, name: newRoom.name!.trim() }
        : room
    );

    onRoomsChange(updatedRooms);
    setEditingRoom(null);
    setNewRoom({ name: "", type: "bedroom", description: "" });
    setShowAddRoom(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    onRoomsChange(rooms.filter(room => room.id !== roomId));
  };

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to data URL for instant upload
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    
    setNewRoom({ ...newRoom, imageURL: dataURL });
  };

  const handleImageUpload = (roomId: string, imageURL: string) => {
    const updatedRooms = rooms.map(room =>
      room.id === roomId ? { ...room, imageURL } : room
    );
    onRoomsChange(updatedRooms);
  };

  const handleCancel = () => {
    setEditingRoom(null);
    setNewRoom({ name: "", type: "bedroom", description: "", imageURL: undefined });
    setShowAddRoom(false);
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Room Management</h3>
        <button
          type="button"
          onClick={(e) => {
            console.log("Add Room button clicked");
            e.preventDefault();
            e.stopPropagation();
            setShowAddRoom(true);
          }}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Room
        </button>
      </div>

      {/* Add/Edit Room Form */}
      {showAddRoom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200"
        >
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingRoom ? "Edit Room" : "Add New Room"}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={newRoom.type || "bedroom"}
                onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as Room['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="bedroom">Bedroom</option>
                <option value="bathroom">Bathroom</option>
                <option value="living_room">Living Room</option>
                <option value="kitchen">Kitchen</option>
                <option value="dining_room">Dining Room</option>
                <option value="balcony">Balcony</option>
                <option value="other">Other</option>
              </select>
            </div>

            {newRoom.type === "other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={newRoom.name || ""}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="Enter custom room name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                {!newRoom.name?.trim() && (
                  <p className="text-red-500 text-sm mt-1">Room name is required</p>
                )}
              </div>
            )}

            {/* Room Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Image (Optional)
              </label>
              {newRoom.imageURL ? (
                <div className="relative inline-block">
                  <img
                    src={newRoom.imageURL}
                    alt="Room preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, imageURL: undefined })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRoomImageUpload}
                    className="hidden"
                    id="room-image-upload"
                  />
                  <label 
                    htmlFor="room-image-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Upload room image</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={newRoom.description || ""}
              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              placeholder="Add any notes about this room..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editingRoom ? handleUpdateRoom() : handleAddRoom();
              }}
              className={`${(newRoom.type === "other" && !newRoom.name?.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
              disabled={newRoom.type === "other" && !newRoom.name?.trim()}
            >
              {editingRoom ? "Update Room" : "Add Room"}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
              }}
              variant="outline"
              className="text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Rooms List */}
      <div className="space-y-4">
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No rooms added yet. Click &quot;Add Room&quot; to get started.</p>
          </div>
        ) : (
          rooms.map((room) => {
            const Icon = roomTypeIcons[room.type];
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* Room Image */}
                  <div className="w-20 h-20 flex-shrink-0">
                    {room.imageURL ? (
                      <img
                        src={room.imageURL}
                        alt={room.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg">{room.name}</h4>
                    {room.description && (
                      <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditRoom(room);
                      }}
                      className="text-yellow-600 hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
