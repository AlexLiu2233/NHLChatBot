import React, { useState, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json'; // Ensure this path is correct
import '../style.css';

const LoginPage = () => {
    const [usernameBoxes, setUsernameBoxes] = useState([]);
    const [passwordBoxes, setPasswordBoxes] = useState([]);
    const [message, setMessage] = useState('');
    const [guessCount, setGuessCount] = useState(0);
    const [teamHint, setTeamHint] = useState('Think of a bird that is fierce and strong.');
    const [captainHint, setCaptainHint] = useState('His last name starts with the letter H.');

    const correctUsername = "VANCOUVER CANUCKS";
    const correctPassword = "HUGHES";

    useEffect(() => {
        // Set the initial state of the input boxes based on the length of the correct answers
        setUsernameBoxes(correctUsername.split('').map(char => ({ letter: '', class: '', editable: char !== ' ' })));
        setPasswordBoxes(correctPassword.split('').map(char => ({ letter: '', class: '', editable: char !== ' ' })));

        // Display the answers in the console for debugging
        console.log('Team Hint (Answer):', correctUsername);
        console.log('Captain Hint (Answer):', correctPassword);
    }, []);

    const handleGuess = (e) => {
        e.preventDefault();
        const usernameGuess = usernameBoxes.map(box => box.letter).join('');
        const passwordGuess = passwordBoxes.map(box => box.letter).join('');

        if (usernameGuess === correctUsername && passwordGuess === correctPassword) {
            setMessage('Login successful!');
        } else {
            highlightBoxes(correctUsername, usernameBoxes, setUsernameBoxes);
            highlightBoxes(correctPassword, passwordBoxes, setPasswordBoxes);
            setMessage('Incorrect guess. Try again.');
        }
        setGuessCount(guessCount + 1);
    };

    const handleUsernameChange = (index, value) => {
        const updatedUsernameBoxes = [...usernameBoxes];
        if (updatedUsernameBoxes[index].editable) {
            updatedUsernameBoxes[index].letter = value.toUpperCase();
        }
        setUsernameBoxes(updatedUsernameBoxes);
    };

    const handlePasswordChange = (index, value) => {
        const updatedPasswordBoxes = [...passwordBoxes];
        if (updatedPasswordBoxes[index].editable) {
            updatedPasswordBoxes[index].letter = value.toUpperCase();
        }
        setPasswordBoxes(updatedPasswordBoxes);
    };

    const highlightBoxes = (correctAnswer, currentBoxes, setBoxes) => {
        const updatedBoxes = currentBoxes.map((box, index) => {
            const letter = box.letter;
            let boxClass = '';
            if (correctAnswer[index] === letter) {
                boxClass = 'correct'; // Correct position
            } else if (correctAnswer.includes(letter)) {
                boxClass = 'present'; // Present but wrong position
            } else {
                boxClass = 'absent'; // Not present
            }
            return { ...box, class: boxClass };
        });
        setBoxes(updatedBoxes);
    };

    return (
        <div className="login-container">
            <div className="animation-container">
                <Player
                    autoplay
                    loop
                    src={animationData}
                    style={{ height: '200px', width: '200px' }}
                />
            </div>
            <form onSubmit={handleGuess} className="login-form">
                <div className="hints">
                    <div>Team Hint: {teamHint}</div>
                    <div>Captain Hint: {captainHint}</div>
                </div>
                <div className="input-boxes">
                    {usernameBoxes.map((box, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={box.letter}
                            onChange={(e) => handleUsernameChange(index, e.target.value)}
                            className={`letter-box ${box.class} ${box.editable ? '' : 'non-editable'}`}
                            disabled={!box.editable}
                        />
                    ))}
                </div>
                <div className="input-boxes">
                    {passwordBoxes.map((box, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={box.letter}
                            onChange={(e) => handlePasswordChange(index, e.target.value)}
                            className={`letter-box ${box.class} ${box.editable ? '' : 'non-editable'}`}
                            disabled={!box.editable}
                        />
                    ))}
                </div>
                <input type="submit" value="Guess" />
            </form>
            <div className="message">{message}</div>
            <div className="guess-count">Guess Count: {guessCount}</div>
        </div>
    );
};

export default LoginPage;
