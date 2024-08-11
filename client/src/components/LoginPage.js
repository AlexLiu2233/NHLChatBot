import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

const LoginPage = ({ setIsAuthenticated }) => {
    const history = useHistory();
    const [teamName, setTeamName] = useState([]);
    const [playerName, setPlayerName] = useState([]);
    const [message, setMessage] = useState('');
    const [teamColors, setTeamColors] = useState([]);
    const [playerColors, setPlayerColors] = useState([]);
    const [correctTeamName, setCorrectTeamName] = useState('');
    const [correctPlayerName, setCorrectPlayerName] = useState('');

    const teamRefs = useRef([]);
    const playerRefs = useRef([]);

    useEffect(() => {
        async function fetchRandomHockeyWordle() {
            try {
                const randomAnswer = await Service.getRandomHockeyWordle();
                console.log('Fetched Random Answer:', randomAnswer);

                setCorrectTeamName(randomAnswer.teamName.toUpperCase());
                setCorrectPlayerName(randomAnswer.playerName.toUpperCase());
                setTeamName(Array(randomAnswer.teamName.length).fill(''));
                setPlayerName(Array(randomAnswer.playerName.length).fill(''));
                setTeamColors(Array(randomAnswer.teamName.length).fill(''));
                setPlayerColors(Array(randomAnswer.playerName.length).fill(''));

                console.log('Correct Team Name:', randomAnswer.teamName);
                console.log('Correct Player Name:', randomAnswer.playerName);
            } catch (error) {
                setMessage('Failed to load a random team and player. Please try again later.');
                console.error('Error fetching random wordle answer:', error);
            }
        }
        fetchRandomHockeyWordle();
    }, []);

    const handleGuess = async (e) => {
        e.preventDefault();
        const teamGuess = teamName.join('').trim().toUpperCase();
        const playerGuess = playerName.join('').trim().toUpperCase();

        console.log('Team Guess:', teamGuess);
        console.log('Player Guess:', playerGuess);

        setTeamColors(getColors(teamGuess, correctTeamName));
        setPlayerColors(getColors(playerGuess, correctPlayerName));

        if (teamGuess === correctTeamName && playerGuess === correctPlayerName) {
            const success = await Service.login(teamGuess, playerGuess);
            if (success) {
                setMessage('Login successful!');
                setIsAuthenticated(true);
                history.push('/lobby');
            } else {
                setMessage('Login failed. Please try again.');
            }
        } else {
            setMessage('Incorrect guess. Try again.');
        }
    };

    const getColors = (guess, correct) => {
        let colors = new Array(correct.length).fill('absent');
        let correctChars = correct.split('');
        let guessChars = guess.split('');

        guessChars.forEach((char, index) => {
            if (char === correctChars[index]) {
                colors[index] = 'correct';
                correctChars[index] = null;
                guessChars[index] = null;
            }
        });

        guessChars.forEach((char, index) => {
            if (char && correctChars.includes(char)) {
                colors[index] = 'present';
                correctChars[correctChars.indexOf(char)] = null;
            }
        });

        return colors;
    };

    const handleInputChange = (e, index, type) => {
        const value = e.target.value.toUpperCase();
        if (type === 'team') {
            const updatedTeamName = [...teamName];
            updatedTeamName[index] = value;
            setTeamName(updatedTeamName);
            if (value && index < teamName.length - 1) {
                teamRefs.current[index + 1].focus();
            }
        } else if (type === 'player') {
            const updatedPlayerName = [...playerName];
            updatedPlayerName[index] = value;
            setPlayerName(updatedPlayerName);
            if (value && index < playerName.length - 1) {
                playerRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (e, index, type) => {
        if (e.key === 'ArrowRight' && index < (type === 'team' ? teamName.length : playerName.length) - 1) {
            if (type === 'team') {
                teamRefs.current[index + 1].focus();
            } else {
                playerRefs.current[index + 1].focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            if (type === 'team') {
                teamRefs.current[index - 1].focus();
            } else {
                playerRefs.current[index - 1].focus();
            }
        } else if (e.key === 'Backspace' && !e.target.value && index > 0) {
            if (type === 'team') {
                teamRefs.current[index - 1].focus();
            } else {
                playerRefs.current[index - 1].focus();
            }
        }
    };

    const renderInputBlocks = (inputArray, refs, handleChange, handleKey, type) => (
        <div className="word-boxes">
            {inputArray.map((char, index) => (
                <input
                    key={index}
                    ref={el => refs.current[index] = el}
                    maxLength="1"
                    value={char}
                    onChange={(e) => handleChange(e, index, type)}
                    onKeyDown={(e) => handleKey(e, index, type)}
                    className="letter-box"
                />
            ))}
        </div>
    );

    const renderColoredWord = (word, colors) => (
        <div className="word-boxes">
            {word.split('').map((char, index) => (
                <span key={index} className={`letter-box ${colors[index] || ''}`}>{char}</span>
            ))}
        </div>
    );

    return (
        <div className="login-container">
            <Player autoplay loop src={animationData} style={{ height: '200px', width: '200px' }} />
            <form onSubmit={handleGuess} className="login-form">
                <label>Team Name:</label>
                {renderInputBlocks(teamName, teamRefs, handleInputChange, handleKeyDown, 'team')}
                {renderColoredWord(teamName.join(''), teamColors)}

                <label>Player Name:</label>
                {renderInputBlocks(playerName, playerRefs, handleInputChange, handleKeyDown, 'player')}
                {renderColoredWord(playerName.join(''), playerColors)}

                <button type="submit">Guess</button>
                <div className="message">{message}</div>
            </form>
        </div>
    );
};

export default LoginPage;
