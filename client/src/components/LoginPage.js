import React, { useState, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json'; // Ensure this path is correct
import '../style.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [guessCount, setGuessCount] = useState(0);
    const [teamHint, setTeamHint] = useState('');
    const [captainHint, setCaptainHint] = useState('');
    const [usernameBoxes, setUsernameBoxes] = useState(['']);
    const [passwordBoxes, setPasswordBoxes] = useState(['']);

    useEffect(() => {
        // Fetch hints from the server
        const fetchHints = async () => {
            try {
                const response = await fetch('/api/hints');
                const hints = await response.json();
                setTeamHint(hints.team);
                setCaptainHint(hints.captain);
                setUsernameBoxes(Array(hints.team.length).fill(''));
                setPasswordBoxes(Array(hints.captain.length).fill(''));
            } catch (error) {
                console.error('Error fetching hints:', error);
                setMessage('An error occurred while fetching hints.');
            }
        };

        fetchHints();
    }, []);

    const handleGuess = async (e) => {
        e.preventDefault();
        try {
            const username = usernameBoxes.join('');
            const password = passwordBoxes.join('');

            const response = await fetch('/api/validate-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            setMessage(result.message);
            if (result.valid) {
                // Redirect or perform successful login actions
            }
            setGuessCount(guessCount + 1);
        } catch (error) {
            console.error('Error during guessing:', error);
            setMessage('An error occurred. Please try again.');
        }
    };

    const handleUsernameChange = (index, value) => {
        const updatedUsernameBoxes = [...usernameBoxes];
        updatedUsernameBoxes[index] = value;
        setUsernameBoxes(updatedUsernameBoxes);
    };

    const handlePasswordChange = (index, value) => {
        const updatedPasswordBoxes = [...passwordBoxes];
        updatedPasswordBoxes[index] = value;
        setPasswordBoxes(updatedPasswordBoxes);
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
                            value={box}
                            onChange={(e) => handleUsernameChange(index, e.target.value)}
                            className="letter-box"
                            required
                        />
                    ))}
                </div>
                <div className="input-boxes">
                    {passwordBoxes.map((box, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            value={box}
                            onChange={(e) => handlePasswordChange(index, e.target.value)}
                            className="letter-box"
                            required
                        />
                    ))}
                </div>
                <input type="submit" value="Login" />
            </form>
            <div className="message">{message}</div>
            <div className="guess-count">Guess Count: {guessCount}</div>
        </div>
    );
};

export default LoginPage;
