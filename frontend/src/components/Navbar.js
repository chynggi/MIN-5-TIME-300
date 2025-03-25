import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, onLogout }) => {
  // user 객체가 존재하면 로그인 상태로 간주합니다.
  const isLoggedIn = !!user;
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-blue-500 text-white p-4 relative"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold"
        >
          <Link to="/">5분 일기</Link>
        </motion.div>
        
        <motion.ul 
          className="flex space-x-4 items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="hover:text-blue-300">홈</Link>
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/write" className="hover:text-blue-300">일기 쓰기</Link>
          </motion.li>
          <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/shared" className="hover:text-blue-300">공유된 일기</Link>
          </motion.li>
          <motion.li 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              className="hover:text-blue-300 flex items-center space-x-1"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {isLoggedIn && user.profile_image ? (
                <img 
                  src={`/uploads/${user.profile_image}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span>프로필</span>
              )}
              <svg 
                className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 mt-2 py-2 w-56 bg-white rounded-lg shadow-xl"
                  onClick={() => setIsProfileOpen(false)}
                >
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-2 flex items-center space-x-3 border-b border-gray-200">
                        {user.profile_image ? (
                          <img 
                            src={`/uploads/${user.profile_image}`} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300" />
                        )}
                        <div>
                          <div className="font-bold text-gray-800">{user.username}</div>
                          <div className="text-sm text-gray-600">{user.mbti}</div>
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white"
                      >
                        회원정보
                      </Link>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white">
                        로그인
                      </Link>
                      <Link to="/register" className="block px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white">
                        회원가입
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        </motion.ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;