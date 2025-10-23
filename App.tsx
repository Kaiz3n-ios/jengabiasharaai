import React, { useState } from 'react';
import Header from './components/Header';
import ImageEditor from './components/ImageEditor';
import AdGenerator from './components/AdGenerator';
import VideoGenerator from './components/VideoGenerator';
import Chatbot from './components/Chatbot';
import Pricing from './components/Pricing';
import { Tab } from './types';
import TabButton from './components/TabButton';
import { PhotoIcon, SparklesIcon, VideoCameraIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon } from './components/IconComponents';

export interface PhotoShootResult {
  imageUrl: string;
  selections: Record<string, string>;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PhotoStudio);
  const [photoShootResult, setPhotoShootResult] = useState<PhotoShootResult | null>(null);

  const handleGenerationComplete = (result: PhotoShootResult) => {
    setPhotoShootResult(result);
    setActiveTab(Tab.AdCampaign); // Automatically switch to the next step
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.PhotoStudio:
        return <ImageEditor onGenerationComplete={handleGenerationComplete} />;
      case Tab.AdCampaign:
        return <AdGenerator photoShootResult={photoShootResult} />;
      case Tab.VideoCommercial:
        return <VideoGenerator photoShootResult={photoShootResult} />;
      case Tab.AIAssistant:
        return <Chatbot />;
      case Tab.Pricing:
        return <Pricing />;
      default:
        return <ImageEditor onGenerationComplete={handleGenerationComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-2xl">
            <div className="p-4 border-b border-gray-700">
              <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <TabButton
                  label="Photo Studio"
                  isActive={activeTab === Tab.PhotoStudio}
                  onClick={() => setActiveTab(Tab.PhotoStudio)}
                  icon={<PhotoIcon />}
                />
                <TabButton
                  label="Ad Campaign"
                  isActive={activeTab === Tab.AdCampaign}
                  onClick={() => setActiveTab(Tab.AdCampaign)}
                  icon={<SparklesIcon />}
                  disabled={!photoShootResult}
                />
                <TabButton
                  label="Video Commercial"
                  isActive={activeTab === Tab.VideoCommercial}
                  onClick={() => setActiveTab(Tab.VideoCommercial)}
                  icon={<VideoCameraIcon />}
                  disabled={!photoShootResult}
                />
                <TabButton
                  label="AI Assistant"
                  isActive={activeTab === Tab.AIAssistant}
                  onClick={() => setActiveTab(Tab.AIAssistant)}
                  icon={<ChatBubbleLeftRightIcon />}
                />
                <TabButton
                  label="Pricing"
                  isActive={activeTab === Tab.Pricing}
                  onClick={() => setActiveTab(Tab.Pricing)}
                  icon={<CurrencyDollarIcon />}
                />
              </nav>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;