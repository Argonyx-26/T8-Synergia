import re

with open('src/app/App.tsx', 'r') as f:
    content = f.read()

# Replace the state declarations to include assessment and loading
content = re.sub(
    r'const \[showResults, setShowResults\] = useState\(false\);',
    'const [showResults, setShowResults] = useState(false);\n  const [isLoading, setIsLoading] = useState(false);\n  const [assessment, setAssessment] = useState<any>(null);',
    content
)

# Replace handleAnalyze
handle_analyze_new = '''  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, weight, height })
      });
      const data = await response.json();
      setAssessment(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing data:', error);
      alert('Failed to connect to backend server. Make sure it is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };'''

content = re.sub(
    r'  const handleAnalyze = \(\) => \{\n    setShowResults\(true\);\n  \};',
    handle_analyze_new,
    content
)

# Use assessment instead of recalculating
recalc_regex = r'  const score = calculateScore\(\);\n  const risk = getRiskLevel\(score\.total\);\n  const cycles = analyzeCycles\(\);\n  const advice = getPersonalizedAdvice\(score\.breakdown\);\n  const warnings = checkDoctorWarnings\(\);\n  const bmi = calculateBMI\(\);'
recalc_new = '''  const cycles = analyzeCycles();
  const warnings = checkDoctorWarnings();
  const bmi = calculateBMI();
  
  const score = assessment?.score || { total: 0, breakdown: { ovulationScore: 0, androgenScore: 0, metabolicScore: 0 } };
  const risk = assessment?.risk || { level: '', color: '', description: '' };
  const advice = assessment?.advice || [];'''

content = re.sub(recalc_regex, recalc_new, content)

# Also disable button while loading
content = re.sub(
    r'<Button\n\s*size="lg"\n\s*onClick=\{handleAnalyze\}\n\s*className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg h-14"\n\s*>',
    '<Button\\n              size="lg"\\n              onClick={handleAnalyze}\\n              disabled={isLoading}\\n              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg h-14"\\n            >',
    content
)

# Add "Loading..." text if loading
content = re.sub(
    r'Analyze Symptoms & Get Results',
    '{isLoading ? "Analyzing..." : "Analyze Symptoms & Get Results"}',
    content
)

with open('src/app/App.tsx', 'w') as f:
    f.write(content)
