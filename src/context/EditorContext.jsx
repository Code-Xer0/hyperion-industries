import { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeEditConfig, setActiveEditConfig] = useState(null); // { model: 'showcase', index: null }

  return (
    <EditorContext.Provider value={{
      isEditMode,
      setIsEditMode,
      activeEditConfig,
      setActiveEditConfig
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
