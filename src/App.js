import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import './TypingIndicator.css';
import userAvatar from './batman.png';
import aiAvatar from './giru.png';
import { useTheme } from './ThemeContext';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // Choose a theme from prismjs/themes
import 'prismjs/components/prism-typescript'; // Load the TypeScript language support

const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

const ChatGPT = () => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationName, setConversationName] = useState('');

  
  const [messages, setMessages] = useState(() => {
    const savedData = localStorage.getItem('savedData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return parsedData.messages || [
        { role: 'assistant', content: 'Hello, how can I help you today?' },
      ];
    }
    return [{ role: 'assistant', content: 'Hello, how can I help you today?' }];
  });

  const updateMessages = useCallback((newMessage) => {
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.map((conv) => {
        if (conv.id === currentConversation) {
          if (newMessage.role === 'user' && !conv.title) {
            return { ...conv, messages: [...conv.messages, newMessage], title: newMessage.content };
          } else {
            return { ...conv, messages: [...conv.messages, newMessage] };
          }
        } else {
          return conv;
        }
      });

      const savedData = {
        messages: messages,
        conversations: updatedConversations,
      };
      localStorage.setItem('savedData', JSON.stringify(savedData));
      return updatedConversations;
    });
  }, []);

  const [conversations, setConversations] = useState(() => {
    const savedData = localStorage.getItem('savedData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData.conversations.length === 0) {
        const newConversation = {
          id: 1,
          messages: [{ role: 'assistant', content: 'Hello, how can I help you today?' }],
          title: '',
        };
        localStorage.setItem('savedData', JSON.stringify({ ...parsedData, conversations: [newConversation] }));
        return [newConversation];
      }
      return parsedData.conversations || [];
    }
    return [];
  });


  const [currentConversation, setCurrentConversation] = useState(1);

  const { theme, toggleTheme, buttonText } = useTheme();
  const chatBoxRef = useRef(null);


  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const currentConversationMessages = useMemo(() => {
    const currentConv = conversations.find((conv) => conv.id === currentConversation);
    return currentConv ? currentConv.messages : [];
  }, [currentConversation, conversations]);

  useEffect(() => {
    setMessages(currentConversationMessages);
  }, [currentConversationMessages]);

  const deleteConversation = (id) => {
    const confirmation = window.confirm('Are you sure you want to delete this conversation?');
    if (confirmation) {
      const updatedConversations = conversations.filter((conversation) => conversation.id !== id);
      if (currentConversation === id) {
        setCurrentConversation(updatedConversations[0]?.id || null);
      }
      setConversations(updatedConversations);
      localStorage.setItem('savedData', JSON.stringify({ messages: messages, conversations: updatedConversations }));
    }
  };

  const resetChat = () => {
    const newId = conversations.length > 0 ? conversations[conversations.length - 1].id + 1 : 1;
    const newConversation = {
      id: newId,
      messages: [{ role: 'assistant', content: 'Hello, how can I help you today?' }],
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversation(newId);
    localStorage.setItem('savedData', JSON.stringify({ messages: messages, conversations: [...conversations, newConversation] }));
  };

  const switchConversation = (id) => {
    console.log('id', id)
    setCurrentConversation(id);
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;
    // Update the conversation name if it's the first message
    if (messages.length === 0) {
      setConversationName(userInput);
    }

    const userMessage = { role: 'user', content: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput('');
  };

  useEffect(() => {
    const fetchAIResponse = async () => {
      if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
        return;
      }

      setIsLoading(true);
      const formattedMessages = messages.map((message) => {
        return { role: message.role, content: message.content };
      });
      console.log('formattedMessages', formattedMessages);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: formattedMessages,
          max_tokens: 2049,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
        }
      );

    const aiMessage = {
      role: 'assistant',
      content: response.data.choices[0].message.content,
    };
    console.log('aiMessage', aiMessage)
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
    setIsLoading(false);
    // Save the chat history to localStorage
    updateMessages(aiMessage);
    localStorage.setItem('savedData', JSON.stringify([...messages, aiMessage]));
  };fetchAIResponse();
}, [messages,updateMessages]);

  const handleKeyDown = (e) => {

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Adjusts the number of rows of the textarea when Shift + Enter is pressed
        e.target.rows += 1;
      } else {
        e.preventDefault(); // Prevents adding a new line
        if (!isLoading) {
          sendMessage(e); // Sends the message when Enter is pressed only if isLoading is false
        }
      }
    } else if (e.key === 'Backspace') {
      // Get the caret position within the textarea
      const caretPosition = e.target.selectionStart;
      const lines = e.target.value.split('\n');
      const currentLineIndex = e.target.value.substr(0, caretPosition).split('\n').length - 1;

      if (currentLineIndex >= 0 && lines[currentLineIndex] === '' && e.target.rows > 1) {
        // Reduces the number of rows of the textarea when Backspace is pressed and the current line is empty
        e.target.rows -= 1;
        // Remove the current empty line
        lines.splice(currentLineIndex, 1);
        e.target.value = lines.join('\n');
        // Set the caret position to the end of the previous line
        const newCaretPosition = e.target.value.split('\n').slice(0, currentLineIndex).join('\n').length;
        e.target.setSelectionRange(newCaretPosition, newCaretPosition);
        e.preventDefault();
      }
    }
  };

  function copyToClipboard(element) {
    const textarea = document.createElement('textarea');
    textarea.textContent = element.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }


  const TypingIndicator = () => {
    return (
      <div className="typing-indicator">
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
      </div>
    );
  };

  const parseMessage = useCallback((content) => {
    //const codeRegex = /```([\s\S]*?)```/g;
    const commentRegex = /(\/\/.*?)\./g;
    //const colonRegex = /:/g;
    const numbersRegex = /(\d+\.)/g;
    const numberColon = /(\d+[:])/g;
    const codeRegex = /```([\s\S]*?)\n([\s\S]*?)```/g;

    let formattedContent = content;
    let match;

    while ((match = codeRegex.exec(content)) !== null) {
      const detectedLanguage = Prism.languages[match[1]];
      const originalCode = match[2];
      const formattedCode = originalCode// Format the code before passing it to Prism

      let highlightedCode = "";

      if (detectedLanguage) {
        highlightedCode = Prism.highlight(formattedCode, detectedLanguage, match[1]);
      } else {
        highlightedCode = Prism.highlight(formattedCode, Prism.languages.typescript, "typescript");
      }

      const formattedHighlightedCode = highlightedCode;

      const languageLabel = `<span style="font-weight: bold; color: red;">${match[1]}</span>`
      const uniqueId = `code-${Date.now()}`;
      const codeBlock = `
      <div class="code-container">
        <pre class="code" id="${uniqueId}">
          <code class="language">${languageLabel}<br/>${formattedHighlightedCode}<br /></code>
        </pre>
        <button
          onClick="(function() {
            const codeElement = document.getElementById('${uniqueId}');
            ${copyToClipboard.toString().replace(/\$/g, '\\$')}
            copyToClipboard(codeElement);
          })()"
          class="copy-button"
        >
          Copy Code
        </button>
      </div>
      <br />
    `;

      formattedContent = formattedContent.replace(match[0], codeBlock);
    }
    if (formattedContent) {
     // formattedContent = formattedContent.replace(colonRegex, (match) => `${match}<br/>`);
      formattedContent = formattedContent.replace(numbersRegex, (match) => `<br/>${match}`);
      formattedContent = formattedContent.replace(numberColon, (match) => `<br/>${match}`);
    }
    while ((match = commentRegex.exec(formattedContent)) !== null) {
      const comment = `<span class="comment">${match[0]}.</span>`;
      formattedContent = formattedContent.replace(match[0], comment);
    }

    return formattedContent;
  }, []);

  const Conversation = React.memo(({ conversation, isActive, switchConversation, deleteConversation }) => {
    const conversationTitle = conversation.title || `Conversation ${conversation.id}`;

    return (
      <div
        className={`conversation ${isActive ? 'active' : ''}`}
        onClick={() => switchConversation(conversation.id)}
      >
        {conversationTitle}
        {conversations.length > 1 && (
          <button className="delete-conversation" onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }}>Delete</button>
        )}
      </div>
    );
  });

  return (

    <div className={`App ${theme}`}>
      <h1 className="logo">Public GPT-3.5-Turbo</h1>
      <div className="reset-chat-container">
        <button className="reset-chat-button" onClick={resetChat}>
          + New Chat
        </button>
        <div className="saved-conversations">
          {conversations.map((conversation) => (
            <Conversation
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversation}
              switchConversation={switchConversation}
              deleteConversation={deleteConversation}
              conversationName={conversationName}
            />
          ))}
        </div>
      </div>
      <button onClick={toggleTheme} className="toggle-theme">
        {buttonText}
      </button>
      <div className="chat-container">

        <div ref={chatBoxRef} className="chat-box">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <img className="avatar" src={message.role === 'user' ? userAvatar : aiAvatar} alt={`${message.role} avatar`} />
              <div
                className={`message-content ${message.role}`}
                dangerouslySetInnerHTML={{ __html: parseMessage(message.content) }}
              />
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <img className="avatar" src={aiAvatar} alt="assistant avatar" />
              <div className="message-content assistant">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>
      </div>
      <form onSubmit={sendMessage}>
        <div className="chat-input-container">
          <textarea
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            rows={1}
          />
          <button type="submit" disabled={isLoading}>Send</button>
        </div>
      </form>
    </div>
  );


};

export default ChatGPT;
