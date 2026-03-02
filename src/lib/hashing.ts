import CryptoJS from 'crypto-js';

/**
 * Generates a SHA-256 hash of a string (simulating file content hashing).
 * In a real browser app with file uploads, you'd use FileReader and 
 * CryptoJS.SHA256(CryptoJS.lib.WordArray.create(arrayBuffer)).
 */
export const generateHash = (content: string): string => {
    return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex).toUpperCase();
};

/**
 * Simulates hashing a "file" by using its name and size/last modified.
 */
export const hashFileMetadata = (file: File): string => {
    const salt = `${file.name}-${file.size}-${file.lastModified}`;
    return generateHash(salt);
};
