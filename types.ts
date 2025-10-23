
export enum Tab {
  PhotoStudio = 'Photo Studio',
  AdCampaign = 'Ad Campaign',
  VideoCommercial = 'Video Commercial',
  AIAssistant = 'AI Assistant',
  Pricing = 'Pricing',
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}