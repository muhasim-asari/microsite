import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Profile, LinkItem } from "../types";
import { getPlatformIcon } from "../components/LinkIcon";
import { ExternalLink, BadgeCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<{ profile: Profile | null; links: LinkItem[] }>({
    profile: null,
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/profile/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
        if (data.profile) {
          document.title = `${data.profile.display_name} - Official Links`;
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-500">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-4 border-rose-300 border-t-rose-600 rounded-full" />
    </div>
  );
  
  if (error || !data.profile) return <div className="min-h-screen flex items-center justify-center bg-rose-50 text-red-500 font-medium">{error}</div>;

  return (
    <div className="min-h-screen bg-[#fdfbfb] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-rose-200">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-orange-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-md mx-auto relative z-10 space-y-10">
        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 to-orange-400 rounded-full blur-md opacity-50"></div>
            <img
              src={data.profile.avatar}
              alt={data.profile.display_name}
              className="relative mx-auto h-28 w-28 rounded-full border-4 border-white shadow-xl object-cover bg-white"
            />
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-lg" title="Verified Store">
              <BadgeCheck className="w-7 h-7 text-sky-500 fill-sky-100" />
            </div>
          </div>
          
          <h1 className="mt-5 text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
            {data.profile.display_name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-rose-600 bg-rose-50 inline-block px-4 py-1.5 rounded-full border border-rose-100 shadow-sm">
            @{data.profile.username}
          </p>
          
          {data.profile.bio && (
            <div className="mt-6 text-sm text-gray-700 bg-white/80 backdrop-blur-md shadow-sm p-5 rounded-2xl border border-white">
              <p className="leading-relaxed font-medium flex flex-col items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                {data.profile.bio}
              </p>
            </div>
          )}
        </motion.div>

        {/* Links Section */}
        <div className="space-y-4">
          {data.links.map((link, index) => (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center p-4 bg-white/90 backdrop-blur-sm border-2 border-transparent hover:border-rose-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              
              <div className="flex-shrink-0 mr-4 bg-gray-50 group-hover:bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-colors">
                {getPlatformIcon(link.platform, true)}
              </div>
              
              <div className="flex-1 font-bold text-gray-800 group-hover:text-rose-700 transition-colors text-lg">
                {link.title}
              </div>
              
              <div className="flex-shrink-0 text-gray-300 group-hover:text-rose-400 transform group-hover:translate-x-1 transition-all">
                <ExternalLink className="w-5 h-5" />
              </div>
            </motion.a>
          ))}
          {data.links.length === 0 && (
            <div className="text-center text-gray-400 text-sm p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 border-dashed">
              Store links coming soon.
            </div>
          )}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-8 text-center"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm text-xs text-gray-500 font-medium border border-gray-100">
            ✨ Powered by Microsite Builder
          </div>
        </motion.div>
      </div>
    </div>
  );
}
