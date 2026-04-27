import { useState } from 'react';
import { httpMLService } from '../../services/HTTPMLService';
import { renderFormattedResponseWithSyntaxHighlighting } from '../../utils/ResponseFormatter';
import { ModelInfo, ModelResponse } from '../../types';

interface ChatContainerProps {
  modelProgress: number;
  isLoadingModel: boolean;
  usingFallback: boolean;
  modelInfo: ModelInfo;
}

export const ChatContainer = ({
  modelProgress,
  isLoadingModel,
  usingFallback,
  modelInfo,
}: ChatContainerProps) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formattedResponse, setFormattedResponse] =
    useState<ModelResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !modelInfo.loaded) return;

    setIsProcessing(true);
    setFormattedResponse(null);

    try {
      console.log('inputText:', inputText);
      const result = await httpMLService.generateResponse(inputText, 1024); // Increased from 256
      console.log('result:', result);

      // Add validation for the response
      if (!result || !result.text) {
        throw new Error('Invalid response from model');
      }

      setFormattedResponse(result);
    } catch (error) {
      console.error('Error generating response:', error);
      setFormattedResponse({
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        tokens: 0,
        time: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {isLoadingModel && (
          <div className="message system-message">
            <div className="message-content">
              <p>
                🔄 Loading AI model... This may take a few minutes on first run.
              </p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${modelProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {usingFallback && (
          <div className="message system-message">
            <div className="message-content">
              <p>
                ⚠️ Running in fallback mode. The main AI model couldn't be
                loaded, but you can still get basic responses.
              </p>
            </div>
          </div>
        )}

        {formattedResponse && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="response-container">
                {renderFormattedResponseWithSyntaxHighlighting(
                  formattedResponse,
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              modelInfo.loaded
                ? usingFallback
                  ? 'Ask me anything... (Simple AI mode)'
                  : 'Ask AI anything... (Your message will be processed locally)'
                : 'Model is loading, please wait...'
            }
            disabled={isProcessing || !modelInfo.loaded || isLoadingModel}
            rows={3}
            className="text-input"
          />
          <button
            type="submit"
            disabled={
              isProcessing ||
              !inputText.trim() ||
              !modelInfo.loaded ||
              isLoadingModel
            }
            className="send-button"
          >
            {isProcessing ? <div className="loading-spinner"></div> : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};
