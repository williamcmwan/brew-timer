interface BuyMeCoffeeProps {
  username?: string;
  className?: string;
}

export function BuyMeCoffee({ username, className = "" }: BuyMeCoffeeProps) {
  // Use provided username or fall back to environment variable
  const buyMeCoffeeUsername = username || import.meta.env.VITE_BUYMEACOFFEE_USERNAME || "yourusername";
  
  const handleClick = () => {
    window.open(`https://www.buymeacoffee.com/${buyMeCoffeeUsername}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-block ${className}`}
      title="Buy me a coffee"
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        className="h-9 w-auto hover:opacity-90 transition-opacity"
      />
    </button>
  );
}
