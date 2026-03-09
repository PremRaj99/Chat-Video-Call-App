import { create } from 'zustand';

interface PartnerState {
  partnerName: string | null;
  setPartnerName: (name: string | null) => void;
}

const usePartnerName = create<PartnerState>((set) => ({
  partnerName: null,
  setPartnerName: (name) => set({ partnerName: name }),
}));

export default usePartnerName;