'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

type Operator = '+' | '-' | '×' | '÷' | null;

interface CalculatorState {
  display: string;
  previousValue: string | null;
  operator: Operator;
  waitingForOperand: boolean;
  expression: string;
  justCalculated: boolean;
}

const initialState: CalculatorState = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  expression: '',
  justCalculated: false,
};

function calculate(a: number, b: number, op: Operator): number | 'Error' {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return 'Error';
      return a / b;
    default:
      return b;
  }
}

function formatNumber(value: string): string {
  if (value === 'Error') return 'Error';
  // Keep as-is if it ends with decimal point or has trailing zeros after decimal
  if (value.endsWith('.')) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  // Format large/small numbers
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6).replace(/\.?0+e/, 'e');
  }
  // Round to avoid floating point issues
  const rounded = parseFloat(num.toPrecision(12));
  return String(rounded);
}

export default function Home() {
  const [state, setState] = useState<CalculatorState>(initialState);

  const handleClear = useCallback(() => {
    setState(initialState);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.waitingForOperand || prev.justCalculated) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
          justCalculated: false,
        };
      }
      if (prev.display === '0' && digit !== '.') {
        return { ...prev, display: digit, justCalculated: false };
      }
      if (digit === '.' && prev.display.includes('.')) {
        return prev;
      }
      if (prev.display.replace('-', '').replace('.', '').length >= 12) {
        return prev;
      }
      return {
        ...prev,
        display: prev.display + digit,
        justCalculated: false,
      };
    });
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    setState((prev) => {
      if (prev.display === 'Error') return initialState;

      const currentValue = prev.display;

      if (prev.operator && prev.waitingForOperand) {
        // Just change the operator
        return {
          ...prev,
          operator: op,
          expression: `${prev.previousValue} ${op}`,
          justCalculated: false,
        };
      }

      if (prev.previousValue !== null && prev.operator && !prev.waitingForOperand && !prev.justCalculated) {
        const result = calculate(
          parseFloat(prev.previousValue),
          parseFloat(currentValue),
          prev.operator
        );
        if (result === 'Error') {
          return {
            ...initialState,
            display: 'Error',
            expression: 'Error',
          };
        }
        const resultStr = formatNumber(String(result));
        return {
          display: resultStr,
          previousValue: resultStr,
          operator: op,
          waitingForOperand: true,
          expression: `${resultStr} ${op}`,
          justCalculated: false,
        };
      }

      return {
        ...prev,
        previousValue: currentValue,
        operator: op,
        waitingForOperand: true,
        expression: `${currentValue} ${op}`,
        justCalculated: false,
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    setState((prev) => {
      if (prev.display === 'Error') return initialState;
      if (prev.operator === null || prev.previousValue === null) {
        return { ...prev, justCalculated: true };
      }

      const currentValue = prev.display;
      const result = calculate(
        parseFloat(prev.previousValue),
        parseFloat(currentValue),
        prev.operator
      );

      if (result === 'Error') {
        return {
          ...initialState,
          display: 'Error',
          expression: `${prev.previousValue} ${prev.operator} ${currentValue} =`,
        };
      }

      const resultStr = formatNumber(String(result));
      return {
        display: resultStr,
        previousValue: null,
        operator: null,
        waitingForOperand: false,
        expression: `${prev.previousValue} ${prev.operator} ${currentValue} =`,
        justCalculated: true,
      };
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.display === '0' || prev.display === 'Error') return prev;
      if (prev.display.startsWith('-')) {
        return { ...prev, display: prev.display.slice(1) };
      }
      return { ...prev, display: '-' + prev.display };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => {
      if (prev.display === 'Error') return prev;
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      const result = value / 100;
      return { ...prev, display: formatNumber(String(result)), justCalculated: false };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleDigit(key);
      } else if (key === '.') {
        e.preventDefault();
        handleDigit('.');
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (key === 'Backspace') {
        e.preventDefault();
        setState((prev) => {
          if (prev.waitingForOperand || prev.justCalculated || prev.display === 'Error') {
            return { ...prev, display: '0' };
          }
          if (prev.display.length === 1 || (prev.display.length === 2 && prev.display.startsWith('-'))) {
            return { ...prev, display: '0' };
          }
          return { ...prev, display: prev.display.slice(0, -1) };
        });
      } else if (key === '%') {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleOperator, handleEquals, handleClear, handlePercent]);

  const displayLength = state.display.length;
  const displaySizeClass =
    displayLength > 12
      ? styles.xsmall
      : displayLength > 9
      ? styles.small
      : '';

  const isOperatorActive = (op: Operator) =>
    state.operator === op && state.waitingForOperand;

  return (
    <div className={styles.wrapper}>
      <div className={styles.calculator}>
        <div className={styles.display}>
          <div className={styles.expression}>{state.expression}</div>
          <div className={`${styles.current} ${displaySizeClass}`}>
            {state.display}
          </div>
        </div>

        <div className={styles.buttons}>
          {/* Row 1 */}
          <button
            className={`${styles.btn} ${styles.btnFunction}`}
            onClick={handleClear}
            aria-label="Clear"
          >
            {state.display !== '0' || state.expression !== '' ? 'C' : 'AC'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnFunction}`}
            onClick={handleToggleSign}
            aria-label="Toggle sign"
          >
            +/−
          </button>
          <button
            className={`${styles.btn} ${styles.btnFunction}`}
            onClick={handlePercent}
            aria-label="Percent"
          >
            %
          </button>
          <button
            className={`${styles.btn} ${styles.btnOperator} ${
              isOperatorActive('÷') ? styles.btnOperatorActive : ''
            }`}
            onClick={() => handleOperator('÷')}
            aria-label="Divide"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('7')}
            aria-label="7"
          >
            7
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('8')}
            aria-label="8"
          >
            8
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('9')}
            aria-label="9"
          >
            9
          </button>
          <button
            className={`${styles.btn} ${styles.btnOperator} ${
              isOperatorActive('×') ? styles.btnOperatorActive : ''
            }`}
            onClick={() => handleOperator('×')}
            aria-label="Multiply"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('4')}
            aria-label="4"
          >
            4
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('5')}
            aria-label="5"
          >
            5
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('6')}
            aria-label="6"
          >
            6
          </button>
          <button
            className={`${styles.btn} ${styles.btnOperator} ${
              isOperatorActive('-') ? styles.btnOperatorActive : ''
            }`}
            onClick={() => handleOperator('-')}
            aria-label="Subtract"
          >
            −
          </button>

          {/* Row 4 */}
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('1')}
            aria-label="1"
          >
            1
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('2')}
            aria-label="2"
          >
            2
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('3')}
            aria-label="3"
          >
            3
          </button>
          <button
            className={`${styles.btn} ${styles.btnOperator} ${
              isOperatorActive('+') ? styles.btnOperatorActive : ''
            }`}
            onClick={() => handleOperator('+')}
            aria-label="Add"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            className={`${styles.btn} ${styles.btnNumber} ${styles.btnZero}`}
            onClick={() => handleDigit('0')}
            aria-label="0"
          >
            0
          </button>
          <button
            className={`${styles.btn} ${styles.btnNumber}`}
            onClick={() => handleDigit('.')}
            aria-label="Decimal point"
          >
            .
          </button>
          <button
            className={`${styles.btn} ${styles.btnOperator}`}
            onClick={handleEquals}
            aria-label="Equals"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
