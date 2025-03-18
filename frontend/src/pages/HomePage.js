import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function HomePage() {
  const [question, setQuestion] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/question")
      .then(response => setQuestion(response.data.question))
      .catch(error => console.error("Error fetching question:", error));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>오늘의 질문</h1>
      <p>{question || "질문을 불러오는 중..."}</p>
      <Link to="/diary">
        <button>일기 작성하기</button>
      </Link>
    </div>
  );
}

export default HomePage;
