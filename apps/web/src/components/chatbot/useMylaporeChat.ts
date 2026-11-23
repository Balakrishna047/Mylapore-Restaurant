'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from '@/context/LocationContext';
import {
  ChatMessage,
  ChatDisplayBlock,
  MenuItemCardData,
  MenuItemDetailData
} from './chat.types';
import { chatApi, clearChatSessionToken } from './chatApi';

export function useMylaporeChat() {
  const { location } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItemDetailData | null>(null);

  const initAttemptedRef = useRef(false);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const outletId = location?.zipCode ? `outlet-${location.zipCode}` : 'outlet-mylapore-001';
      const data = await chatApi.initSession(outletId);
      setSessionToken(data.sessionToken);
      setSessionId(data.sessionId);

      const welcomeMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        sender: 'agent',
        text: data.welcomeMessage,
        timestamp: new Date(),
        displayBlocks: data.displayBlocks
      };

      setMessages([welcomeMsg]);
    } catch (err: any) {
      console.error('[MylaporeChat] Failed to initialize chat session:', err);
      setError('Unable to connect to the restaurant concierge. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [location?.zipCode]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!sessionToken) {
      initSession();
    }
  }, [sessionToken, initSession]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        let currentToken = sessionToken;
        const outletId = location?.zipCode ? `outlet-${location.zipCode}` : 'outlet-mylapore-001';

        if (!currentToken) {
          const sessionData = await chatApi.initSession(outletId);
          currentToken = sessionData.sessionToken;
          setSessionToken(currentToken);
          setSessionId(sessionData.sessionId);
        }

        let turnResult;
        try {
          turnResult = await chatApi.sendTurn(trimmed, currentToken);
        } catch (turnErr: any) {
          // Self-healing: if session expired, not found, or invalid token, re-initialize automatically
          const errMsg = turnErr?.message || '';
          if (
            errMsg.includes('not found') ||
            errMsg.includes('404') ||
            errMsg.includes('initialize a new session') ||
            errMsg.includes('Missing required x-chat-session-token')
          ) {
            console.warn('[MylaporeChat] Stale/invalid session detected. Auto-recovering fresh session...');
            clearChatSessionToken();
            const recoveryData = await chatApi.initSession(outletId);
            currentToken = recoveryData.sessionToken;
            setSessionToken(currentToken);
            setSessionId(recoveryData.sessionId);
            // Retry user turn with recovered session
            turnResult = await chatApi.sendTurn(trimmed, currentToken);
          } else {
            throw turnErr;
          }
        }

        const agentMsg: ChatMessage = {
          id: turnResult.turnId,
          sender: 'agent',
          text: turnResult.agentText,
          timestamp: new Date(),
          executionMode: turnResult.executionMode || 'AGENTFORCE',
          turnToken: turnResult.turnToken,
          agentProof: turnResult.agentProof,
          displayBlocks: turnResult.displayBlocks
        };

        setMessages((prev) => [...prev, agentMsg]);
      } catch (err: any) {
        console.error('[MylaporeChat] Turn failed:', err);
        setError(err.message || 'Apologies, failed to process your message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken, isLoading, location?.zipCode]
  );

  const selectCategory = useCallback(
    (categorySlug: string, categoryName: string) => {
      sendMessage(`Show dishes in ${categoryName}`);
    },
    [sendMessage]
  );

  const viewItemDetail = useCallback(
    (item: MenuItemCardData) => {
      sendMessage(`Tell me details about ${item.name}`);
    },
    [sendMessage]
  );

  const resetChat = useCallback(async () => {
    clearChatSessionToken();
    setSessionToken(null);
    setSessionId(null);
    setMessages([]);
    setError(null);
    setSelectedItemDetail(null);
    await initSession();
  }, [initSession]);

  return {
    isOpen,
    isMinimized,
    sessionToken,
    sessionId,
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
  };
}
