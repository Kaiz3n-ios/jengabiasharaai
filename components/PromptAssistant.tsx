import React, { useState, useEffect, useCallback } from 'react';

interface OptionCategory {
  title: string;
  key: string;
  options: string[];
  allowCustom?: boolean;
}

interface PromptAssistantProps {
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  promptTemplate: (options: Record<string, string>) => string;
  optionCategories: OptionCategory[];
  disabledOptions?: Record<string, string>;
  disclaimer?: string;
  initialSelections?: Record<string, string>;
  onSelectionsChange?: (selections: Record<string, string>) => void;
}

const PromptAssistant: React.FC<PromptAssistantProps> = ({
  prompt,
  setPrompt,
  promptTemplate,
  optionCategories,
  disabledOptions = {},
  disclaimer,
  initialSelections,
  onSelectionsChange,
}) => {
  const getInitialState = useCallback(() => {
    if (initialSelections) {
      return initialSelections;
    }
    const initial: Record<string, string> = {};
    optionCategories.forEach(cat => {
      if (cat.options.length > 0) {
        initial[cat.key] = cat.options[0];
      } else {
        initial[cat.key] = '';
      }
    });
    return initial;
  }, [optionCategories, initialSelections]);

  const [selections, setSelections] = useState<Record<string, string>>(getInitialState);

  // Effect to auto-compose prompt on first load and when selections change
  useEffect(() => {
    const composedPrompt = promptTemplate(selections);
    setPrompt(composedPrompt);
  }, [selections, promptTemplate, setPrompt]);
  
  // Effect to update parent when selections change
  useEffect(() => {
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  // Effect to update selections when initialSelections prop changes (for Ad Generator)
  useEffect(() => {
    if (initialSelections) {
      // Merge initial selections with defaults to ensure all keys are present
      const defaults = getInitialState();
      const mergedSelections = { ...defaults, ...initialSelections };
      setSelections(mergedSelections);
    }
  }, [initialSelections, getInitialState]);


  const handleSelection = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <h4 className="text-md font-semibold text-gray-300">Prompt Assistant</h4>
      <p className="text-sm text-gray-400">Select options to build the perfect prompt, or write your own below.</p>
      {disclaimer && <p className="text-xs text-gray-500 italic mt-1">{disclaimer}</p>}
      
      <div className="space-y-4">
        {optionCategories.map(category => {
          const disabledReason = disabledOptions[category.key];
          const isDisabled = !!disabledReason;
          return (
            <div
              key={category.key}
              className={isDisabled ? 'opacity-50' : ''}
              title={disabledReason}
            >
              <label className="block text-sm font-medium text-gray-400 mb-2">{category.title}</label>
              <div className="flex flex-wrap gap-2">
                {category.options.map(option => (
                  <button
                    key={option}
                    onClick={() => !isDisabled && handleSelection(category.key, option)}
                    disabled={isDisabled}
                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${selections[category.key] === option && !isDisabled ? 'bg-amber-500 text-gray-900 font-semibold' : 'bg-gray-700 text-gray-300'} ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {category.allowCustom && (
                <input
                  type="text"
                  placeholder="Or type a custom location..."
                  className="mt-2 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-200"
                  value={category.options.includes(selections[category.key]) ? '' : selections[category.key] || ''}
                  onChange={(e) => !isDisabled && handleSelection(category.key, e.target.value)}
                  disabled={isDisabled}
                />
              )}
            </div>
          )
        })}
      </div>

      <textarea
        rows={4}
        className="mt-2 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-200"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Your generated prompt will appear here. You can edit it directly."
      />
    </div>
  );
};

export default PromptAssistant;