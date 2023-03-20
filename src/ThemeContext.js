import { createContext, useContext, useEffect, useState } from 'react';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme;
  } else {
    localStorage.setItem("theme", "light");
    return "light";
  }
};

const ThemeContext = createContext({
  theme: getInitialTheme(),
  toggleTheme: () => { },
  buttonText: getInitialTheme()
});


export const ThemeProvider = ({ children }) => {
  const initialTheme = getInitialTheme();
  const [theme, setTheme] = useState(getInitialTheme());
  const [buttonText, setButtonText] = useState(
    initialTheme === "light" ? "Dark theme" : "Light theme"
  );

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      setButtonText(newTheme === "light" ? "Dark theme" : "Light theme");
      return newTheme;
    });
  };

  useEffect(() => {
    document.body.className = theme;
    document.getElementById('root').className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, buttonText }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
