import Head from "next/head";
import { useState, useEffect, useRef, JSX} from "react";
import styles from "./index.module.css";

export default function Home() {
  const [message, setMessage ] = useState("");
  const [response, setResponse ] = useState("");

  const sendQuery = async (tasteNotes: string) => {
    const response = await fetch("/api/generate?endpoint=chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({message: tasteNotes }),
    });
    const data = await response.json();
    if (data.success) {
      setResponse(data.message)
    }
  };

  const onSubmit = (event: Event) => {
    event.preventDefault();
    if (!message.trim()) return;
    sendQuery(message);
  };

  return (
    <div>
      <Head>
        <title>What’s that coffee?</title>
      </Head>
      <h1 className={styles.heading1}>Get coffee processing method from taste notes</h1>
      <div className={styles.messageInputContainer}>
        <form onSubmit={onSubmit}>
          <textarea
            className={styles.textarea}
            name="message"
            placeholder="Type your coffee tasting notes here..."
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <div className={styles.buttonGroup}>
            <input className={styles.inputSubmit} type="submit" value="Get processing method" />
          </div>
        </form>
        <p className="response">
         {response ? `Most likely coffee processing method: ${response}` : ''}
        </p>
      </div>
    </div>
  );
}
