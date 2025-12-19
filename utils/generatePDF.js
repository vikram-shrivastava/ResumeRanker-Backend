import latex from "node-latex";
import streamToBuffer from "stream-to-buffer";

/**
 * Converts LaTeX code to PDF buffer
 * @param {string} latexCode - The LaTeX code string
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generatePDFfromLatex = (latexCode) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF stream
      const pdfStream = latex(latexCode);

      if(!pdfStream){
        return reject(new Error("Failed to create PDF stream from LaTeX code"));
      }
      console.log("PDF stream created successfully",pdfStream);
      // Convert stream to buffer
      streamToBuffer(pdfStream, (err, buffer) => {
        if (err){
          console.error("Error converting stream to buffer:", err);
          return reject(err);}
        resolve(buffer);
      });

      // Handle errors from LaTeX compilation
      pdfStream.on("error", (err) => reject(err));
    } catch (error) {
      console.error("Error in generatePDFfromLatex:", error);
      reject(error);
    }
  });
};
