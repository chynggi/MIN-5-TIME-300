import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [data, setData] = useState([]);

  // 백엔드 기본 메시지 가져오기
  useEffect(() => {
    axios.get('http://localhost:5000/')
      .then((response) => {
        setMessage(response.data);
      })
      .catch((error) => console.error('Error fetching message:', error));
  }, []);

  // 데이터베이스 데이터 가져오기 예제
  const fetchData = () => {
    axios.get('http://localhost:5000/api/data')
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => console.error('Error fetching data:', error));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{message}</h1>
      <button onClick={fetchData}>데이터 불러오기</button>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
