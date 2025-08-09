import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <div className="App">
      <ChatBot 
        userId="student_payona_001"
        conversationId="payona_overseas_education"
        serverUrl="http://localhost:8000"
      />
    </div>
  );
}

export default App;
