'use client';

import React, { useState, useEffect } from 'react';
import { useMylaporeChat } from './useMylaporeChat';
import { ChatLauncher } from './ChatLauncher';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { MenuItemDetail } from './MenuItemDetail';

export const ChatWidget: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    error,
    selectedItemDetail,
    openChat,
    closeChat,
    toggleMinimize,
    sendMessage,
    selectCategory,
    viewItemDetail,
    setSelectedItemDetail,
    resetChat
  } = useMylaporeChat();

  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        setSelectedItemDetail(null);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted, setSelectedItemDetail]);

  // Lock body scroll on mobile view when chatbot drawer is full-screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen && !isMinimized && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized]);

  const handleClose = () => {
    closeChat();
  };

  return (
    <>
      <ChatLauncher onClick={openChat} isOpen={isOpen || mounted} />

      {/* Mobile Backdrop Overlay with tap-to-close */}
      {mounted && !isMinimized && (
        <div
          onClick={handleClose}
          aria-hidden="true"
          className={`fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 sm:hidden transition-opacity duration-200 cursor-pointer ${
            isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {mounted && (
        <div
          role="dialog"
          aria-label="Mylapore Express Culinary Chatbot"
          className={`fixed z-50 flex flex-col bg-[#FFFDF9] border border-amber-200/90 shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14 rounded-2xl'
              : 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-full sm:h-[620px] max-h-[100vh] sm:max-h-[85vh] rounded-none sm:rounded-2xl'
          } ${
            isClosing
              ? 'opacity-0 scale-95 translate-y-3 sm:translate-y-4 pointer-events-none'
              : 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          }`}
        >
          {/* Chat Header */}
          <ChatHeader
            onClose={handleClose}
            onMinimize={toggleMinimize}
            onReset={resetChat}
            isMinimized={isMinimized}
          />

          {!isMinimized && (
            <>
              {/* Message History & Display Blocks */}
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                onSelectCategory={selectCategory}
                onViewItemDetail={viewItemDetail}
                onSelectDetailBlock={(detail) => setSelectedItemDetail(detail)}
                onSelectPrompt={(prompt) => sendMessage(prompt)}
                onResetChat={resetChat}
              />

              {/* Chat Input & Quick Chips */}
              <ChatInput
                onSendMessage={sendMessage}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      )}

      {/* Item Detail Recipe & Allergen Modal */}
      <MenuItemDetail
        item={selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
      />
    </>
  );
};

export default ChatWidget;
