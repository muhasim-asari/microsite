import React from "react";
import { ShoppingBag, ShoppingCart, Store, Music, Instagram, MessageCircle, Youtube, Facebook, Link as LinkIcon } from "lucide-react";

export function getPlatformIcon(platform: string, colorful: boolean = false) {
  const size = "w-6 h-6";
  switch (platform.toLowerCase()) {
    case 'shopee': return <ShoppingBag className={`${size} ${colorful ? 'text-orange-500' : ''}`} />;
    case 'tokopedia': return <ShoppingCart className={`${size} ${colorful ? 'text-green-500' : ''}`} />;
    case 'lazada': return <Store className={`${size} ${colorful ? 'text-blue-800' : ''}`} />;
    case 'tiktok': return <Music className={`${size} ${colorful ? 'text-black' : ''}`} />;
    case 'instagram': return <Instagram className={`${size} ${colorful ? 'text-pink-600' : ''}`} />;
    case 'whatsapp': return <MessageCircle className={`${size} ${colorful ? 'text-green-600' : ''}`} />;
    case 'youtube': return <Youtube className={`${size} ${colorful ? 'text-red-600' : ''}`} />;
    case 'facebook': return <Facebook className={`${size} ${colorful ? 'text-blue-600' : ''}`} />;
    default: return <LinkIcon className={`${size} ${colorful ? 'text-gray-600' : ''}`} />;
  }
}
