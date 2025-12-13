export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function validatePassword(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label: string;
  let color: string;

  switch (score) {
    case 0:
    case 1:
      label = "Very Weak";
      color = "hsl(0 84% 60%)";
      break;
    case 2:
      label = "Weak";
      color = "hsl(25 95% 53%)";
      break;
    case 3:
      label = "Fair";
      color = "hsl(48 96% 53%)";
      break;
    case 4:
      label = "Strong";
      color = "hsl(142 76% 36%)";
      break;
    case 5:
      label = "Very Strong";
      color = "hsl(142 76% 36%)";
      break;
    default:
      label = "Very Weak";
      color = "hsl(0 84% 60%)";
  }

  return { score, label, color, requirements };
}
