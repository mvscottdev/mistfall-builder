import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from '../src/components/App';

test('placeholder page shows the app name', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Mistfall Builder' })).toBeInTheDocument();
});
