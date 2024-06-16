import React, { useState, useEffect } from "react";
import "./App.css";

function prepareJSONData(data) {
  return JSON.stringify(data, null, 2);
}

function QuestionProgress({ currentPage, totalPages }) {
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;

  const progressBarStyle = {
    height: "10px",
    width: `${progressPercentage}%`,
    backgroundColor: "rgba(0, 51, 160)",
    transition: "width 0.3s ease",
  };

  // Adjusted styles for the container of the progress bar
  const containerStyle = {
    display: "flex",
    justifyContent: "flex-start", // Align items to the start
    alignItems: "center",
    width: "200px",
    backgroundColor: "rgba(0, 51, 160, 0.2)",
  };

  // Styles for the outer container remain the same to center the 200px container
  const outerContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  };

  return (
    <div style={outerContainerStyle}>
      <div style={containerStyle}>
        <div style={progressBarStyle}></div>
      </div>
    </div>
  );
}

function TabsContainer({ tabs, currentIndex }) {
  return (
    <ul
      style={{
        padding: 0,
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {tabs.map((item, index) => (
        <Tab
          key={index}
          index={index}
          currentIndex={currentIndex}
          totalItems={tabs.length}
          item={item}
        />
      ))}
    </ul>
  );
}

function Tab({ index, currentIndex, totalItems, item }) {
  const isCurrentOrPast = index <= currentIndex;
  const style = {
    display: "inline-block",
    backgroundColor: isCurrentOrPast
      ? `rgba(0, 128, 0)`
      : `rgba(0, 128, 160, 0.1)`,
    color: isCurrentOrPast ? "white" : "black",
    transition: "background-color 0.3s ease",
    marginRight: "1px",
    padding: "5px",
  };
  return <li style={style}>{item}</li>;
}

function ResetModal({ onClose, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          color: "red",
          padding: "20px",
          borderRadius: "25px",
          textAlign: "center",
          border: "1px solid black",
        }}
      >
        <p>Are you sure you want to clear all your answers?</p>
        <button
          onClick={onConfirm}
          style={{
            marginRight: "10px",
            borderRadius: "10px",
            backgroundColor: "red",
            padding: "15px",
          }}
        >
          Yes
        </button>
        <button onClick={onClose}>No</button>
      </div>
    </div>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [currentPage, setCurrentPage] = useState({});
  const [questionsPerPage] = useState(1);

  const [activeTab, setActiveTab] = useState(0);

  const [userResponses, setUserResponses] = useState(() => {
    const savedResponses = localStorage.getItem("userResponses");
    return savedResponses ? JSON.parse(savedResponses) : {};
  });

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({});

  useEffect(() => {
    fetch("/values.json")
      .then((response) => response.json())
      .then((data) => {
        setValues(data);

        const initialPages = data.reduce((acc, _, index) => {
          acc[index] = 0;
          return acc;
        }, {});
        setCurrentPage(initialPages);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("userResponses", JSON.stringify(userResponses));
  }, [userResponses]);

  const handleChange = (e, itemIndex, questionIndex) => {
    const key = `item-${itemIndex}-question-${questionIndex}`;
    const updatedResponses = {
      ...userResponses,
      [key]: {
        answer: e.target.value,
        value: values[itemIndex].value,
      },
    };

    setUserResponses(updatedResponses);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < values.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(
      values[currentIndex]?.questions.length / questionsPerPage
    );
    setCurrentPage((prevPages) => ({
      ...prevPages,
      [currentIndex]:
        prevPages[currentIndex] < totalPages - 1
          ? prevPages[currentIndex] + 1
          : prevPages[currentIndex],
    }));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPages) => ({
      ...prevPages,
      [currentIndex]:
        prevPages[currentIndex] > 0
          ? prevPages[currentIndex] - 1
          : prevPages[currentIndex],
    }));
  };

  const currentPageIndex = currentPage[currentIndex] || 0;
  const indexOfLastQuestion = (currentPageIndex + 1) * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = values[currentIndex]?.questions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    setLastPosition({
      page: currentIndex,
      questionIndex: currentPage[currentIndex],
    });

    

    const tempSummaryData = values.reduce((acc, valueItem) => {
      const behaviour = valueItem.behaviour;
      const value = valueItem.value;

      const uniqueKey = `${value}-${behaviour}`;

      valueItem.questions.forEach((question, qIndex) => {
        const responseKey = `item-${values.indexOf(
          valueItem
        )}-question-${qIndex}`;
        if (
          userResponses[responseKey] &&
          userResponses[responseKey].answer.length > 0
        ) {
          if (!acc[uniqueKey])
            acc[uniqueKey] = { behaviour: behaviour, questions: [] };
          acc[uniqueKey].questions.push({
            question: question,
            answer: userResponses[responseKey].answer,
          });
        }
      });

      return acc;
    }, {});

    setSummaryData(tempSummaryData);
    setShowSummary(true);
  };

  const item = values[currentIndex];

  const [lastPosition, setLastPosition] = useState({
    page: null,
    questionIndex: null,
  });

  const resetFormFields = () => {
    if (lastPosition.page !== null && lastPosition.questionIndex !== null) {
      setCurrentIndex(lastPosition.page);
      setCurrentPage((prevPages) => ({
        ...prevPages,
        [lastPosition.page]: lastPosition.questionIndex,
      }));
    }
    setLastPosition({ page: null, questionIndex: null });
    setShowSummary(false); // Add this line to hide the summary view
    setShowIntro(false); // Ensure we don't return to the intro screen
  };

  const totalQuestions = item?.questions.length;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  if (showIntro) {
    return (
      <div className="App">
        <h1>CERN Behavioural Competency Model Evaluation</h1>
        <p>Welcome to the <strong>unofficial</strong> CERN Behavioural Competency Model Evaluation app, a personal development tool designed to help you measure yourself against the CERN Behavioural Competency model at your own pace.</p>
        <p>The CERN Competency Model serves as a reference to ensure consistency and coherence in CERN HR-related processes. The model identifies and defines the core values and behaviours that foster effective collaboration at CERN. For further details, please visit the <a href="https://hr.web.cern.ch/the-cern-competency-model">CERN Competency Model</a> page.</p>
        <p>Understanding and embodying these competencies can significantly enhance our ability to work together harmoniously and allows us to reflect on what makes living and working together easier and more meaningful. This reflection helps us consider the behaviours we should observe in ourselves and expect from others, and how these behaviours influence our work's effectiveness. The model also outlines leadership competencies critical to driving CERN's mission forward.</p>
        <p>Use this app to evaluate yourself, gain insights, and reflect on your alignment with the competencies that are vital to creating a collaborative and innovative environment at CERN. Take your time to explore and develop these skills at your own pace.</p>
        <p>Your answers are <strong>NOT</strong> shared and do not leave your web browser.</p>
        <button onClick={() => setShowIntro(false)}>Start</button>
      </div>
    );
  }

  if (showSummary) {

    function downloadSummary(format) {
      let data;
      switch (format) {
        case "json":
          data = prepareJSONData(summaryData);
          break;
        default:
          data = prepareJSONData(summaryData);
      }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `summary.${format}`;
      a.click();
      URL.revokeObjectURL(url);

    }

    return (
      <div className="App">
        <h1>Summary of Your Answers</h1>
        <button onClick={() => downloadSummary("json")}>Download JSON</button>
        <button onClick={resetFormFields}>Return to Questions</button>
        {Object.entries(summaryData).map(([key, { behaviour, questions }]) => {
          // Extract value and behaviour from the key
          const [value, behaviourName] = key.split("-");
          return (
            <div key={key}>
              <h2>
                {value} - {behaviourName}
              </h2>
              <ul>
                {questions.map((q, index) => (
                  <li key={index}>
                    <p>{q.question}</p>
                    <p className="answer">{q.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <button onClick={resetFormFields}>Return to Questions</button>
      </div>
    );
  }

  if (showModal) {
    return (
      <ResetModal
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          setUserResponses({});
          setShowModal(false);
          // back to the first question
          setCurrentIndex(0);
          setCurrentPage({});
          window.location.reload(); // nope, lets just reload the page...
        }}
      />
    );
  }

  currentQuestions?.map((question, index) => {
    const questionIndex = indexOfFirstQuestion + index;
    const key = `item-${currentIndex}-question-${questionIndex}`;

    return (
      <div key={index}>
        <h2>{question}</h2>
        <textarea
          type="text"
          value={userResponses[key]?.answer || ""}
          onChange={(e) => handleChange(e, currentIndex, questionIndex)}
        ></textarea>
      </div>
    );
  });
  
  return (
    <div className="App">
      <div>
        <TabsContainer
          tabs={values.map((item) => item.value)}
          currentIndex={currentIndex}
        />
        <div>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === values.length - 1}
          >
            Next
          </button>
        </div>
        <h2>{item?.behaviour}</h2>
        <div>
          <div>
            <button className="tab" onClick={() => setActiveTab(0)}>Behaviours</button>
            <button className="tab" onClick={() => setActiveTab(1)}>Effective</button>
            <button className="tab" onClick={() => setActiveTab(2)}>Ineffective</button>
          </div>
          <div>
            {activeTab === 0 && <div className="tabContent">
              <h3>Behaviours</h3>
              <ol>
                {item?.traits.map((behaviour, index) => (
                  <li key={index}>{behaviour}</li>
                ))}
              </ol>  
            </div>}
            {activeTab === 1 && <div className="tabContent">
              <h3>Effective behaviours</h3>
              <ol>
                {item?.effective.map((behaviour, index) => (
                  <li key={index}>{behaviour}</li>
                ))}
              </ol>
            </div>}
            {activeTab === 2 && <div className="tabContent">
              <h3>Ineffective behaviours</h3>
              <ol>
                {item?.ineffective.map((behaviour, index) => (
                  <li key={index}>{behaviour}</li>
                ))}
              </ol>
            </div>}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* question textarea */}
          {currentQuestions?.map((question, index) => {
            const questionIndex = indexOfFirstQuestion + index;
            const key = `item-${currentIndex}-question-${questionIndex}`;

            return (
              <div key={index}>
                <h2>{question}</h2>
                <textarea
                  type="text"
                  value={userResponses[key]?.answer || "situation, action, result..."}
                  onChange={(e) => handleChange(e, currentIndex, questionIndex)}
                ></textarea>
              </div>
            );
          })}
          <p>
            Question {indexOfFirstQuestion + 1} of {totalQuestions}
          </p>
          <QuestionProgress
            currentPage={currentPage[currentIndex] || 0}
            totalPages={totalPages}
          />
          <div>
            <button type="button" className="resetButton" onClick={() => setShowModal(true)}>
              Reset
            </button>

            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage[currentIndex] === 0}
            >
              Previous Question
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage[currentIndex] + 1 >= totalPages}
            >
              Next Question
            </button>

            <button type="submit">Summary</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
