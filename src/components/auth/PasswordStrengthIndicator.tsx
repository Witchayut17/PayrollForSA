import { Check, X } from "lucide-react";
import { PasswordStrength } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const { score, label, color, requirements } = strength;

  const labelTh = {
    "Very Weak": "อ่อนมาก",
    "Weak": "อ่อน",
    "Fair": "พอใช้",
    "Strong": "แข็งแกร่ง",
    "Very Strong": "แข็งแกร่งมาก",
  }[label] || label;

  const requirementsList = [
    { key: "minLength", label: "อย่างน้อย 8 ตัวอักษร", met: requirements.minLength },
    { key: "hasUppercase", label: "ตัวพิมพ์ใหญ่ (A-Z)", met: requirements.hasUppercase },
    { key: "hasLowercase", label: "ตัวพิมพ์เล็ก (a-z)", met: requirements.hasLowercase },
    { key: "hasNumber", label: "ตัวเลข (0-9)", met: requirements.hasNumber },
    { key: "hasSpecial", label: "อักขระพิเศษ (!@#$%...)", met: requirements.hasSpecial },
  ];

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">ความแข็งแกร่งรหัสผ่าน</span>
          <span style={{ color }}>{labelTh}</span>
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
