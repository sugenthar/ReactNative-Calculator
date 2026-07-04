import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CalculatorScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [currentNumber, setCurrentNumber] = useState('');
  const [lastNumber, setLastNumber] = useState('');
  const [operation, setOperation] = useState('');

  const isOperator = (char: string) => ['+', '-', '*', '/', '^', '!', '√', '%'].includes(char);
  const isSpecial = (char: string) => ['π', '√', '!'].includes(char);

  const handleInput = (buttonPressed: string) => {
    if (currentNumber === 'Error') {
      if (buttonPressed === 'AC') {
        setLastNumber('');
        setCurrentNumber('');
      } else if (!isOperator(buttonPressed) && buttonPressed !== '=') {
        setCurrentNumber(buttonPressed);
      }
      return;
    }

    if (buttonPressed === 'AC') {
      setLastNumber('');
      setCurrentNumber('');
      return;
    }

    if (buttonPressed === 'DEL') {
      setCurrentNumber(prev => prev.slice(0, -1));
      return;
    }

    if (buttonPressed === '=') {
      if (!currentNumber) return;
      try {
        setLastNumber(currentNumber + ' =');
        let expr = currentNumber;

        // Pre-process expression
        expr = expr.replace(/π/g, `(${Math.PI})`);

        // Factorial: (\d+)! -> computed value
        expr = expr.replace(/(\d+)!/g, (_, num) => {
          let n = parseInt(num);
          if (n > 170) return 'Infinity'; // JS limit
          let res = 1;
          for (let i = 2; i <= n; i++) res *= i;
          return res.toString();
        });

        // Square root: √(\d+) -> Math.sqrt($1)
        expr = expr.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');

        // Handle consecutive operators if any (though UI should prevent)
        expr = expr.replace(/\^/g, '**');
        expr = expr.replace(/%/g, '/100');

        // Basic safety check for eval
        if (/[^0-9+\-*/.**()Math.sqrtInfiyt,x]/.test(expr.replace(/Math\.sqrt|Infinity/g, ''))) {
          throw new Error('Invalid characters');
        }

        // eslint-disable-next-line no-eval
        const result = eval(expr);
        setCurrentNumber(Number.isFinite(result) ? result.toString() : 'Error');
      } catch (e) {
        setCurrentNumber('Error');
      }
      return;
    }

    // Prevent repeated operators
    const lastChar = currentNumber.slice(-1);
    if (isOperator(buttonPressed) && isOperator(lastChar)) {
      // Replace last operator with new one unless it's a special unary
      if (!isSpecial(buttonPressed)) {
        setCurrentNumber(prev => prev.slice(0, -1) + buttonPressed);
        return;
      }
    }

    setCurrentNumber(prev => prev + buttonPressed);
  };

  const Row = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.row}>{children}</View>
  );

  const Button = ({ text, theme, type = 'number', size = 'single' }: { text: string, theme: any, type?: 'number' | 'operator' | 'action', size?: 'single' | 'double' }) => {
    let backgroundColor = theme.secondaryBackground;
    let color = theme.text;

    if (type === 'operator') {
      backgroundColor = theme.tint;
      color = colorScheme === 'dark' ? '#000' : '#fff';
    } else if (type === 'action') {
      backgroundColor = '#A5A5A5'; // iOS Light gray
      color = '#000';
    }

    if (colorScheme === 'dark' && type === 'number') {
      backgroundColor = '#333333';
    }

    const width = size === 'double' ? '46%' : '23%';

    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor,
            width: width as any, // dynamic width
          }
        ]}
        onPress={() => handleInput(text)}
      >
        <Text style={[styles.text, { color }]}>{text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.resultContainer}>
        <Text style={[styles.historyText, { color: theme.icon }]}>{lastNumber}</Text>
        <Text style={[styles.resultText, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {currentNumber}
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <Row>
          <Button text="√" theme={theme} type="operator" />
          <Button text="π" theme={theme} type="operator" />
          <Button text="^" theme={theme} type="operator" />
          <Button text="!" theme={theme} type="operator" />
        </Row>
        <Row>
          <Button text="AC" theme={theme} type="action" />
          <Button text="DEL" theme={theme} type="action" />
          <Button text="%" theme={theme} type="action" />
          <Button text="/" theme={theme} type="operator" />
        </Row>
        <Row>
          <Button text="7" theme={theme} />
          <Button text="8" theme={theme} />
          <Button text="9" theme={theme} />
          <Button text="*" theme={theme} type="operator" />
        </Row>
        <Row>
          <Button text="4" theme={theme} />
          <Button text="5" theme={theme} />
          <Button text="6" theme={theme} />
          <Button text="-" theme={theme} type="operator" />
        </Row>
        <Row>
          <Button text="1" theme={theme} />
          <Button text="2" theme={theme} />
          <Button text="3" theme={theme} />
          <Button text="+" theme={theme} type="operator" />
        </Row>
        <Row>
          <Button text="0" theme={theme} size="double" />
          <Button text="." theme={theme} />
          <Button text="=" theme={theme} type="operator" />
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultContainer: {
    flex: 1.5, // Reduced from 2 to give more space to buttons
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    paddingBottom: 30,
  },
  buttonsContainer: {
    flex: 4, // Increased from 3
    paddingHorizontal: 20,
    paddingBottom: 20, // Increased for better spacing
    justifyContent: 'space-between', // Changed from space-around to space-between for better control
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced from 12
  },
  button: {
    height: 72, // Reduced from 80
    borderRadius: 36, // Half of height
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 28, // Slightly smaller text
    fontWeight: '500',
  },
  historyText: {
    fontSize: 24,
    marginBottom: 10,
    marginRight: 10,
  },
  resultText: {
    fontSize: 60, // Slightly smaller result text to avoid wrapping
    fontWeight: '300',
  }
});
