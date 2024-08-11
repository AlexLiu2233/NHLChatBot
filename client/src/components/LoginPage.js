import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

const LoginPage = ({ setIsAuthenticated }) => {
    const history = useHistory();
    const teamLength = 18; // Maximum length of team name
    const playerLength = 6; // Maximum length of player name

    const [teamName, setTeamName] = useState(Array(teamLength).fill(''));
    const [playerName, setPlayerName] = useState(Array(playerLength).fill(''));
    const [message, setMessage] = useState('');
    const [teamColors, setTeamColors] = useState(Array(teamLength).fill(''));
    const [playerColors, setPlayerColors] = useState(Array(playerLength).fill(''));

    const teamRefs = useRef([]);
    const playerRefs = useRef([]);

    const correctTeamName = "VANCOUVER CANUCKS";
    const correctPlayerName = "HUGHES";

    /**
     * Handles the form submission and evaluates the guesses.
     * Updates the color state based on the correctness of each letter.
     */
    const handleGuess = async (e) => {
        e.preventDefault();
        const teamGuess = teamName.join('').trim().toUpperCase();
        const playerGuess = playerName.join('').trim().toUpperCase();

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

    /**
     * Determines the color of each letter based on its correctness.
     * @param {string} guess - The user's guess.
     * @param {string} correct - The correct answer.
     * @returns {Array} - Array of color states for each letter.
     */
    const getColors = (guess, correct) => {
        let colors = new Array(correct.length).fill('absent');
        let correctChars = correct.split('');
        let guessChars = guess.split('');

        // First pass: Check for correct positions
        guessChars.forEach((char, index) => {
            if (char === correctChars[index]) {
                colors[index] = 'correct';
                correctChars[index] = null;
                guessChars[index] = null;
            }
        });

        // Second pass: Check for correct letters in wrong positions
        guessChars.forEach((char, index) => {
            if (char && correctChars.includes(char)) {
                colors[index] = 'present';
                correctChars[correctChars.indexOf(char)] = null;
            }
        });

        return colors;
    };

    /**
     * Handles input changes and moves to the next block if a letter is entered.
     */
    const handleInputChange = (e, index, type) => {
        const value = e.target.value.toUpperCase();
        if (type === 'team') {
            const updatedTeamName = [...teamName];
            updatedTeamName[index] = value;
            setTeamName(updatedTeamName);
            if (value && index < teamLength - 1) {
                teamRefs.current[index + 1].focus();
            }
        } else if (type === 'player') {
            const updatedPlayerName = [...playerName];
            updatedPlayerName[index] = value;
            setPlayerName(updatedPlayerName);
            if (value && index < playerLength - 1) {
                playerRefs.current[index + 1].focus();
            }
        }
    };

    /**
     * Handles key events for navigation (arrow keys, backspace) between blocks.
     */
    const handleKeyDown = (e, index, type) => {
        if (e.key === 'ArrowRight' && index < (type === 'team' ? teamLength : playerLength) - 1) {
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

    /**
     * Renders the input blocks for team and player names.
     */
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

    /**
     * Renders the word with colored letters.
     * @param {string} word - The word to render.
     * @param {Array} colors - The color states for each letter.
     * @returns {JSX.Element} - The rendered word with colored letters.
     */
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
