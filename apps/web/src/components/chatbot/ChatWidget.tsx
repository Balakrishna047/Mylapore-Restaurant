'use client';

import React from 'react';
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

  return (
    <>
      <ChatLauncher onClick={openChat} isOpen={isOpen} />

      {isOpen && (
        <div
          role="dialog"
          aria-label="Mylapore Express Culinary Chatbot"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14'
              : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-full sm:h-[620px] max-h-[100vh] sm:max-h-[85vh]'
          } bg-[#FFFDF9] rounded-none sm:rounded-2xl shadow-2xl border border-amber-200/90 overflow-hidden`}
        >
          {/* Chat Header */}
          <ChatHeader
            onClose={closeChat}
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
