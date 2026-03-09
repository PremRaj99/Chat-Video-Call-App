import { create } from 'zustand';

export type Message = {
  content: string;
  sender: "me" | "partner";
  timestamp: string;
};

interface MessagesState {
  messages: Message[];
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
}

const useMessages = create<MessagesState>((set) => ({
  messages: [],
  setMessages: (updater) =>
    set((state) => ({
      messages: typeof updater === "function" ? updater(state.messages) : updater,
    })),
  clearMessages: () => set({ messages: [] }),
}));

export default useMessages;