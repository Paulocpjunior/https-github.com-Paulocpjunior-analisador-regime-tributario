
import { SavedAnalysis, AnalysisInputs, AnaliseTributaria } from '../types';

const STORAGE_KEY = 'taxAnalysisApp';

export const getSavedAnalyses = (): SavedAnalysis[] => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Defensively check if the parsed data is an array.
            // If not, it's corrupted, so we clear it and return an empty array.
            if (!Array.isArray(parsedData)) {
                console.error("Corrupted data found in localStorage. Expected an array, but got:", typeof parsedData);
                localStorage.removeItem(STORAGE_KEY);
                return [];
            }

            const analyses: SavedAnalysis[] = parsedData;
            // Sort by date descending
            return analyses.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        }
        return [];
    } catch (error) {
        console.error("Failed to retrieve or parse analyses from localStorage:", error);
        // If parsing fails, the data is likely corrupted. Clear it.
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (removeError) {
            console.error("Failed to remove corrupted data from localStorage:", removeError);
        }
        return [];
    }
};

export const saveAnalysis = (name: string, inputs: AnalysisInputs, result: AnaliseTributaria): boolean => {
    try {
        const analyses = getSavedAnalyses();
        const newAnalysis: SavedAnalysis = {
            id: new Date().toISOString(),
            name,
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            inputs,
            result,
        };
        analyses.push(newAnalysis);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
        return true;
    } catch (error) {
        console.error("Failed to save analysis to localStorage:", error);
        return false;
    }
};

export const deleteAnalysis = (id: string): void => {
    try {
        let analyses = getSavedAnalyses();
        if(!Array.isArray(analyses)) return;
        analyses = analyses.filter(analysis => analysis.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    } catch (error) {
        console.error("Failed to delete analysis from localStorage:", error);
    }
};
