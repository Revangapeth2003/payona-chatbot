import React from 'react';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PayOna Chat Application</h1>
      </header>
      <main>
        <ChatBot 
          userId="user123"
          conversationId="support-chat"
          serverUrl="http://localhost:3001"
        />
      </main>
    </div>
  );
}

export default App;
