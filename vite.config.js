// Impostazioni di Vite, il programma che avvia il gioco sul computer
export default {
  // La cartella da cui il gioco viene servito. Sul computer è "/" (come ora). Nel gioco online (GitHub Pages) l'indirizzo ha una
  // sottocartella, per questo la costruzione online imposta BASE_PERCORSO (vedi .github/workflows/pubblica.yml)
  base: process.env.BASE_PERCORSO || '/',
  resolve: {
    preserveSymlinks: true, // usa i percorsi dei file così come sono (evita problemi con alcune cartelle di Windows)
  },
};
