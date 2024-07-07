import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

const LoginPage = ({ setIsAuthenticated }) => {
    const history = useHistory();
    const [usernameBoxes, setUsernameBoxes] = useState([]);
    const [passwordBoxes, setPasswordBoxes] = useState([]);
    const [message, setMessage] = useState('');
    const [guessCount, setGuessCount] = useState(0);
    const [teamHint, setTeamHint] = useState('Think of a bird that is fierce and strong.');
    const [captainHint, setCaptainHint] = useState('His last name starts with the letter H.');
    const usernameRefs = useRef([]);
    const passwordRefs = useRef([]);

    const correctUsername = "VANCOUVER CANUCKS";
    const correctPassword = "HUGHES";

    useEffect(() => {
        setUsernameBoxes(correctUsername.split('').map((char, index) => ({
            letter: '', class: '', editable: char !== ' ', ref: React.createRef()
        })));
        setPasswordBoxes(correctPassword.split('').map((char, index) => ({
            letter: '', class: '', editable: char !== ' ', ref: React.createRef()
        })));
    }, []);

    const handleGuess = async (e) => {
        e.preventDefault();
        const usernameGuess = usernameBoxes.map(box => box.letter || ' ').join('').trim().toUpperCase();
        const passwordGuess = passwordBoxes.map(box => box.letter || ' ').join('').trim().toUpperCase();
    
        if (usernameGuess === correctUsername && passwordGuess === correctPassword) {
            try {
                const success = await Service.login(usernameGuess, passwordGuess);
                console.log('Login attempt response:', success);
                if (success) {
                    setMessage('Login successful!');
                    setIsAuthenticated(true);
                    history.push('/');
                } else {
                    setMessage('Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                setMessage('An error occurred. Please try again.');
            }
        } else {
            highlightBoxes(correctUsername, usernameBoxes, setUsernameBoxes);
            highlightBoxes(correctPassword, passwordBoxes, setPasswordBoxes);
            setMessage('Incorrect guess. Try again.');
        }
        setGuessCount(guessCount + 1);
    };

    const handleUsernameChange = (index, event) => {
        const value = event.target.value.toUpperCase();
        const updatedUsernameBoxes = [...usernameBoxes];
        if (updatedUsernameBoxes[index].editable && value) {
            updatedUsernameBoxes[index].letter = value;
            setUsernameBoxes(updatedUsernameBoxes);
            if (index + 1 < usernameBoxes.length) {
                usernameRefs.current[index + 1].focus();
            }
        }
    };

    const handlePasswordChange = (index, event) => {
        const value = event.target.value.toUpperCase();
        const updatedPasswordBoxes = [...passwordBoxes];
        if (updatedPasswordBoxes[index].editable && value) {
            updatedPasswordBoxes[index].letter = value;
            setPasswordBoxes(updatedPasswordBoxes);
            if (index + 1 < passwordBoxes.length) {
                passwordRefs.current[index + 1].focus();
            }
        }
    };

    const highlightBoxes = (correctAnswer, currentBoxes, setBoxes) => {
        const updatedBoxes = currentBoxes.map((box, index) => {
            const letter = box.letter;
            let boxClass = '';
            if (correctAnswer[index] === letter) {
                boxClass = 'correct';
            } else if (correctAnswer.includes(letter)) {
                boxClass = 'present';
            } else {
                boxClass = 'absent';
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
                            ref={el => usernameRefs.current[index] = el}
                            type="text"
                            maxLength="1"
                            value={box.letter}
                            onChange={(e) => handleUsernameChange(index, e)}
                            className={`letter-box ${box.class} ${box.editable ? '' : 'non-editable'}`}
                            disabled={!box.editable}
                        />
                    ))}
                </div>
                <div className="input-boxes">
                    {passwordBoxes.map((box, index) => (
                        <input
                            key={index}
                            ref={el => passwordRefs.current[index] = el}
                            type="text"
                            maxLength="1"
                            value={box.letter}
                            onChange={(e) => handlePasswordChange(index, e)}
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
