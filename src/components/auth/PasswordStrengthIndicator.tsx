import { Check, X } from "lucide-react";
import { PasswordStrength } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const { score, label, color, requirements } = strength;

  const requirementsList = [
    { key: "minLength", label: "At least 8 characters", met: requirements.minLength },
    { key: "hasUppercase", label: "Uppercase letter (A-Z)", met: requirements.hasUppercase },
    { key: "hasLowercase", label: "Lowercase letter (a-z)", met: requirements.hasLowercase },
    { key: "hasNumber", label: "Number (0-9)", met: requirements.hasNumber },
    { key: "hasSpecial", label: "Special character (!@#$%...)", met: requirements.hasSpecial },
  ];

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span style={{ color }}>{label}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${(score / 5) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1 text-xs">
        {requirementsList.map((req) => (
          <li key={req.key} className="flex items-center gap-2">
            {req.met ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
