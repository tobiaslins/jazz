import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasskeyAuthBasicUI from './PasskeyAuthBasicUI.svelte';

const logIn = vi.fn().mockResolvedValue(undefined);
const signUp = vi.fn().mockResolvedValue(undefined);

const defaultProps = {
  auth: {
    current: {
      logIn,
      signUp,
    },
    state: 'anonymous',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  logIn.mockResolvedValue(undefined);
  signUp.mockResolvedValue(undefined);
});

describe('PasskeyAuthBasicUI', () => {
  it('should show ready state with login and signup options', () => {
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    expect(screen.getByText('Log in with existing account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('should call logIn when login button is clicked', async () => {
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    await userEvent.click(screen.getByText('Log in with existing account'));
    expect(logIn).toHaveBeenCalled();
  });

  it('should show login errors', async () => {
    logIn.mockRejectedValue(new Error('Test error message'));
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    await userEvent.click(screen.getByText('Log in with existing account'));
    expect(logIn).toHaveBeenCalled();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should call signUp with name when form is submitted', async () => {
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    const input = screen.getByPlaceholderText('Display name');
    await userEvent.type(input, 'Test User');
    await userEvent.click(screen.getByText('Sign up'));

    expect(signUp).toHaveBeenCalledWith('Test User');
  });

  it('should show signup errors', async () => {
    signUp.mockRejectedValue(new Error('Test error message'));
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    const input = screen.getByPlaceholderText('Display name');
    await userEvent.type(input, 'Test User');
    await userEvent.click(screen.getByText('Sign up'));

    expect(signUp).toHaveBeenCalledWith('Test User');
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should not call signUp when name is empty', async () => {
    render(PasskeyAuthBasicUI, {
      props: defaultProps
    });

    await userEvent.click(screen.getByText('Sign up'));
    expect(signUp).not.toHaveBeenCalled();
  });
});