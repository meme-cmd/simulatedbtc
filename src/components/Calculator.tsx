'use client';

import { useState } from 'react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [operator, setOperator] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (value: string) => {
    if (waitingForOperand) {
      setDisplay(value);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  };

  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previous === null) {
      setPrevious(display);
    } else if (operator) {
      const previousValue = parseFloat(previous);
      const newValue = calculate(previousValue, inputValue, operator);

      setDisplay(String(newValue));
      setPrevious(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (firstOperand: number, secondOperand: number, operator: string): number => {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
      default:
        return secondOperand;
    }
  };

  const performCalculation = () => {
    if (operator && previous !== null && !waitingForOperand) {
      const inputValue = parseFloat(display);
      const previousValue = parseFloat(previous);
      const newValue = calculate(previousValue, inputValue, operator);

      setDisplay(String(newValue));
      setPrevious(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setOperator(null);
    setPrevious(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (!waitingForOperand) {
      const newDisplay = display.length > 1 ? display.slice(0, -1) : '0';
      setDisplay(newDisplay);
    }
  };

  const CalcButton = ({ onClick, children, className = '' }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <button 
      onClick={onClick} 
      className={`w-full h-8 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div style={{ width: '200px', padding: '8px' }}>
      <div className="field-row mb-2">
        <input 
          type="text" 
          value={display} 
          readOnly 
          style={{ width: '100%', textAlign: 'right', fontSize: '14px' }}
        />
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        <CalcButton onClick={clearAll}>C</CalcButton>
        <CalcButton onClick={() => inputOperator('/')}>÷</CalcButton>
        <CalcButton onClick={() => inputOperator('*')}>×</CalcButton>
        <CalcButton onClick={backspace}>←</CalcButton>
        
        <CalcButton onClick={() => inputNumber('7')}>7</CalcButton>
        <CalcButton onClick={() => inputNumber('8')}>8</CalcButton>
        <CalcButton onClick={() => inputNumber('9')}>9</CalcButton>
        <CalcButton onClick={() => inputOperator('-')}>-</CalcButton>
        
        <CalcButton onClick={() => inputNumber('4')}>4</CalcButton>
        <CalcButton onClick={() => inputNumber('5')}>5</CalcButton>
        <CalcButton onClick={() => inputNumber('6')}>6</CalcButton>
        <CalcButton onClick={() => inputOperator('+')}>+</CalcButton>
        
        <CalcButton onClick={() => inputNumber('1')}>1</CalcButton>
        <CalcButton onClick={() => inputNumber('2')}>2</CalcButton>
        <CalcButton onClick={() => inputNumber('3')}>3</CalcButton>
        <CalcButton onClick={performCalculation} className="row-span-2">=</CalcButton>
        
        <CalcButton onClick={() => inputNumber('0')} className="col-span-2">0</CalcButton>
        <CalcButton onClick={() => inputNumber('.')}>.</CalcButton>
      </div>
    </div>
  );
}
