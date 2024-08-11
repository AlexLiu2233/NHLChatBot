import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Service } from './Service';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../animations/MascotPanda.json';
import '../style.css';

/**
 * LoginPage Component
 *
 * This component represents the login page for the application. It includes a
 * wordle-like guessing game where the user needs to correctly guess the team
 * name and player name to authenticate. Upon successful authentication, the user
 * is redirected to the lobby page.
 *
 * Props:
 * - setIsAuthenticated (function): A function to update the authentication state in the parent component.
 *
 * State:
 * - teamName (Array<string>): Stores the user's input for the team name, with each character in a separate index.
 * - playerName (Array<string>): Stores the user's input for the player name, with each character in a separate index.
 * - message (string): Stores the feedback message displayed to the user after a guess attempt.
 * - teamColors (Array<string>): Stores the color state for each letter in the team name to indicate correctness.
 * - playerColors (Array<string>): Stores the color state for each letter in the player name to indicate correctness.
 *
 * Refs:
 * - teamRefs (Array<React.RefObject>): References to the input elements for the team name to handle focus.
 * - playerRefs (Array<React.RefObject>): References to the input elements for the player name to handle focus.
 */
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
     * handleGuess
     * 
     * Handles the form submission when the user makes a guess. It evaluates the
     * correctness of the team name and player name input by comparing them to the
     * correct answers. If both inputs are correct, it attempts to log in the user
     * using the Service module and, upon success, updates the authentication state
     * and redirects to the lobby page.
     * 
     * @param {React.FormEvent} e - The form submission event.
     */
    const handleGuess = async (e) => {
        e.preventDefault();
        const teamGuess = teamName.join('').trim().toUpperCase();
        const playerGuess = playerName.join('').trim().toUpperCase();

        // Update colors based on the correctness of the guess
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
     * getColors
     * 
     * Determines the color of each letter based on its correctness relative to the correct answer.
     * The colors are used to provide feedback to the user in a wordle-style game.
     * 
     * @param {string} guess - The user's guess.
     * @param {string} correct - The correct answer.
     * @returns {Array<string>} - An array of color states ('correct', 'present', 'absent') for each letter.
     */
    const getColors = (guess, correct) => {
        let colors = new Array(correct.length).fill('absent');
        let correctChars = correct.split('');
        let guessChars = guess.split('');

        // First pass: Check for correct letters in the correct positions
        guessChars.forEach((char, index) => {
            if (char === correctChars[index]) {
                colors[index] = 'correct';
                correctChars[index] = null;
                guessChars[index] = null;
            }
        });

        // Second pass: Check for correct letters in incorrect positions
        guessChars.forEach((char, index) => {
            if (char && correctChars.includes(char)) {
                colors[index] = 'present';
                correctChars[correctChars.indexOf(char)] = null;
            }
        });

        return colors;
    };

    /**
     * handleInputChange
     * 
     * Handles changes to the input fields for team and player names. It updates the
     * respective state with the user's input and automatically moves the focus to the
     * next input field if a character is entered.
     * 
     * @param {React.ChangeEvent} e - The input change event.
     * @param {number} index - The index of the input field being modified.
     * @param {string} type - The type of input ('team' or 'player') being modified.
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
     * handleKeyDown
     * 
     * Handles key events for navigating between input fields using arrow keys and backspace.
     * It allows the user to move focus left or right and handles backspace behavior for easier correction.
     * 
     * @param {React.KeyboardEvent} e - The keydown event.
     * @param {number} index - The index of the input field being navigated.
     * @param {string} type - The type of input ('team' or 'player') being navigated.
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
     * renderInputBlocks
     * 
     * Renders the input fields for the team and player names. Each input block corresponds to
     * a single letter and is styled appropriately for the wordle-like guessing game.
     * 
     * @param {Array<string>} inputArray - The array representing the current input state (team or player name).
     * @param {React.RefObject} refs - References to the input elements for handling focus.
     * @param {function} handleChange - Function to handle changes in the input fields.
     * @param {function} handleKey - Function to handle keydown events for navigation.
     * @param {string} type - The type of input ('team' or 'player') being rendered.
     * @returns {JSX.Element} - The rendered input blocks.
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
     * renderColoredWord
     * 
     * Renders the user's input word with colored letters to indicate the correctness
     * of each letter (green for correct, yellow for present in the wrong position, grey for absent).
     * 
     * @param {string} word - The word to render.
     * @param {Array<string>} colors - The color states for each letter in the word.
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
