const fs = require('fs');
const { execSync } = require('child_process');

const DATA_FILE = 'commit-history.json';

function getCommitInfo(sha, isFirstCommit) {
  let commitMessage, commitDate, author;

  try {
    commitMessage = execSync(`git log -1 --pretty=%B ${sha}`).toString().trim();
    commitDate = new Date(execSync(`git log -1 --format=%cd ${sha}`).toString()).toISOString();
    author = execSync(`git log -1 --pretty=format:%an ${sha}`).toString().trim();
  } catch (error) {
    console.error(`Error al obtener información del commit ${sha}:`, error);
    return null;
  }

  // Obtener la URL del repositorio, si está disponible
  let repoUrl = '';
  try {
    repoUrl = execSync('git config --get remote.origin.url').toString().trim().replace(/\.git$/, '');
    if (repoUrl.startsWith('git@')) {
      repoUrl = repoUrl.replace(/^git@([^:]+):(.+)$/, 'https://$1/$2');
    }
  } catch {
    console.warn('No se encontró un repositorio remoto.');
  }

  // Obtener adiciones y eliminaciones
  let additions = 0, deletions = 0;
  if (!isFirstCommit) {
    try {
      const diffStats = execSync(`git diff --stat ${sha}~1 ${sha}`).toString();
      const additionsMatch = diffStats.match(/(\d+) insertion/);
      const deletionsMatch = diffStats.match(/(\d+) deletion/);
      additions = additionsMatch ? parseInt(additionsMatch[1]) : 0;
      deletions = deletionsMatch ? parseInt(deletionsMatch[1]) : 0;
    } catch {}
  } else {
    // Si es el primer commit, considerar todas las líneas como adiciones
    additions = execSync(`git diff --stat ${sha}`).toString().match(/(\d+) insertion/);
    additions = additions ? parseInt(additions[1]) : 0;
  }

  // Obtener el recuento de pruebas y cobertura
  let testCount = 0, coverage = 0;
  if (fs.existsSync('package.json')) {
    try {
      // Ejecutar las pruebas con Jest y obtener el resultado en formato JSON
      const jestOutput = execSync('npx jest --json', { stdio: 'pipe' }).toString();
      const jestResults = JSON.parse(jestOutput);

      // Contar todas las pruebas (exitosas y fallidas)
      testCount = jestResults.numTotalTests;

      // Ejecutar las pruebas de cobertura
      const coverageOutput = execSync('npm test -- --coverage', { stdio: 'pipe' }).toString();
      const coverageMatch = coverageOutput.match(/All files\s*\|\s*(\d+(\.\d+)?)\s*\|/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }
    } catch (error) {
      console.error('Error al ejecutar las pruebas o calcular la cobertura:', error);
    }
  }

  // Determinar la conclusión del commit
  const conclusion = determineConclusion(coverage, testCount);

  return {
    sha,
    author,
    commit: {
      date: commitDate,
      message: commitMessage,
      url: repoUrl ? `${repoUrl}/commit/${sha}` : ''
    },
    stats: {
      total: additions + deletions,
      additions,
      deletions,
      date: commitDate.split('T')[0]
    },
    coverage,
    test_count: testCount,
    conclusion
  };
}


function determineConclusion(coverage, testCount) {

  // Verificar si hay pruebas fallidas
  let hasFailedTests = false;
  let hasCompilationErrors = false;
  if (fs.existsSync('package.json')) {
    try {
      const jestOutput = execSync('npx jest --json', { stdio: 'pipe' }).toString();
      const jestResults = JSON.parse(jestOutput);
      hasFailedTests = jestResults.numFailedTests > 0;
    } catch (error) {
      hasCompilationErrors = true;
    }
  }

  if (hasFailedTests || hasCompilationErrors) {
    return 'failure'; // Hay pruebas fallidas o errores de compilación
  }

  if (testCount > 0) {
    return 'success'; 
  }

  return 'neutral'; 
}

// Función para identificar commits duplicados basados en el contenido
function isDuplicate(newCommit, existingCommits) {
  for (const commit of existingCommits) {
    // Comparar mensaje de commit y fecha para identificar posibles duplicados
    if (commit.commit.message === newCommit.commit.message &&
        commit.stats.additions === newCommit.stats.additions &&
        commit.stats.deletions === newCommit.stats.deletions &&
        commit.test_count === newCommit.test_count) {

      // Si encontramos un commit con el mismo contenido, verificamos la fecha
      // y mantenemos el más antiguo
      const existingDate = new Date(commit.commit.date);
      const newDate = new Date(newCommit.commit.date);

      if (newDate >= existingDate) {
        console.log(`Detectado commit con contenido duplicado (${newCommit.sha}), se mantiene el más antiguo (${commit.sha})`);
        return true; // Es un duplicado y es más reciente, así que lo rechazamos
      }
    }
  }
  return false; // No es un duplicado o es más antiguo que el existente
}

function saveCommitData(commitData) {
  let commits = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      commits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
      console.error('Error al leer el archivo de datos:', error);
      commits = [];
    }
  }

  // Verificar si el commit ya existe por SHA
  const existingIndex = commits.findIndex(c => c.sha === commitData.sha);

  if (existingIndex >= 0) {
    // Si el SHA ya existe, actualizamos su información
    commits[existingIndex] = commitData;
    console.log(`Actualizada la información del commit ${commitData.sha}`);
  } else if (!isDuplicate(commitData, commits)) {
    // Solo agregamos el commit si no es un duplicado por contenido
    commits.push(commitData);
    console.log(`Agregado nuevo commit ${commitData.sha}`);
  }

  // Actualizar la URL del repositorio en todas las entradas si se ha configurado
  if (commitData.commit.url) {
    commits.forEach(commit => {
      if (!commit.commit.url) {
        commit.commit.url = commitData.commit.url.replace(/\/commit\/[^/]+$/, `/commit/${commit.sha}`);
      }
    });
  }

  // Ordenar los commits por fecha (más antiguos primero)
  commits.sort((a, b) => new Date(a.commit.date) - new Date(b.commit.date));

  // Guardar los commits
  fs.writeFileSync(DATA_FILE, JSON.stringify(commits, null, 2));
}

try {
  // Crear el archivo commit-history.json si no existe
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }

  // Obtener el SHA del commit actual
  const currentSha = execSync('git rev-parse HEAD').toString().trim();

  // Determinar si es el primer commit
  const isFirstCommit = execSync('git rev-list --count HEAD').toString().trim() === '1';

  // Procesar el commit actual
  const currentCommitData = getCommitInfo(currentSha, isFirstCommit);
  if (currentCommitData) {
    saveCommitData(currentCommitData);
  }
} catch (error) {
  console.error('Error en el script de seguimiento de commits:', error);
  process.exit(1);
}