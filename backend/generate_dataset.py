import numpy as np
import pandas as pd
import os

def generate_pcos_dataset(n_samples=1000, random_state=42):
    np.random.seed(random_state)
    
    # 1. Demographic & Anthropometric
    age = np.random.randint(15, 45, size=n_samples)
    height = np.random.uniform(145, 175, size=n_samples) # in cm
    # Weight generation slightly correlated with PCOS traits (we will adjust later)
    weight = np.random.uniform(40, 110, size=n_samples) # in kg
    bmi = weight / ((height / 100) ** 2)
    
    # 2. Cycle Information
    # In PCOS, cycle irregularity and long cycles are very common
    cycle_regularity = np.random.choice([0, 1], size=n_samples, p=[0.6, 0.4]) # 1 = irregular
    cycle_length = np.zeros(n_samples)
    for i in range(n_samples):
        if cycle_regularity[i] == 1:
            cycle_length[i] = np.random.uniform(35, 60)
        else:
            cycle_length[i] = np.random.uniform(25, 34)
            
    cycle_period = np.random.randint(3, 9, size=n_samples)
    
    # 3. Clinical Symptoms (probabilities will be shifted based on PCOS presence later, 
    # but let's initialize them first)
    family_history = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
    physical_activity = np.random.choice([1, 2, 3], size=n_samples, p=[0.4, 0.4, 0.2]) # 1: Low, 2: Med, 3: High
    stress_level = np.random.randint(1, 11, size=n_samples) # 1 to 10
    sleep_duration = np.random.uniform(5, 9, size=n_samples) # hours
    
    # 4. Hormones & Blood parameters
    # In normal women, LH and FSH are roughly equal (ratio ~1). In PCOS, LH/FSH ratio is often > 2
    fsh = np.random.uniform(2.0, 12.0, size=n_samples)
    lh = np.zeros(n_samples)
    amh = np.zeros(n_samples)
    testosterone = np.zeros(n_samples)
    fasting_insulin = np.zeros(n_samples)
    blood_glucose = np.random.uniform(70, 140, size=n_samples)
    
    # Base hormone generation
    for i in range(n_samples):
        lh[i] = fsh[i] * np.random.uniform(0.5, 1.5)
        amh[i] = np.random.uniform(0.5, 4.0)
        testosterone[i] = np.random.uniform(15, 45)
        fasting_insulin[i] = np.random.uniform(2.0, 12.0)
        
    # 5. Determine PCOS status using a logistic probability model
    # We define a log-odds formula based on clinical knowledge:
    # PCOS features: High LH/FSH ratio, High AMH, High Testosterone, Irregular cycles, High BMI, High Insulin
    log_odds = (
        -6.5 # intercept
        + 1.8 * cycle_regularity
        + 0.15 * (bmi - 22)
        + 1.2 * family_history
        + 1.5 * (lh / fsh > 1.8).astype(int)
        + 0.8 * (amh > 4.5).astype(int)
        + 0.05 * (testosterone - 45)
        + 0.12 * (fasting_insulin - 12)
        + 0.02 * (blood_glucose - 90)
        + 0.15 * stress_level
        - 0.25 * sleep_duration
        - 0.5 * (physical_activity - 1)
    )
    
    # Probability of PCOS
    prob = 1 / (1 + np.exp(-log_odds))
    pcos = np.random.binomial(1, prob)
    
    # Now, let's adjust symptoms to be strongly correlated with PCOS status (consistency)
    hirsutism = np.zeros(n_samples, dtype=int)
    acne = np.zeros(n_samples, dtype=int)
    hair_loss = np.zeros(n_samples, dtype=int)
    dark_patches = np.zeros(n_samples, dtype=int)
    weight_gain = np.zeros(n_samples, dtype=int)
    difficulty_losing_weight = np.zeros(n_samples, dtype=int)
    fatigue = np.zeros(n_samples, dtype=int)
    mood_swings = np.zeros(n_samples, dtype=int)
    pelvic_pain = np.zeros(n_samples, dtype=int)
    infertility = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        if pcos[i] == 1:
            hirsutism[i] = np.random.choice([0, 1], p=[0.25, 0.75])
            acne[i] = np.random.choice([0, 1], p=[0.3, 0.7])
            hair_loss[i] = np.random.choice([0, 1], p=[0.4, 0.6])
            dark_patches[i] = np.random.choice([0, 1], p=[0.35, 0.65])
            weight_gain[i] = np.random.choice([0, 1], p=[0.3, 0.7])
            difficulty_losing_weight[i] = np.random.choice([0, 1], p=[0.25, 0.75])
            fatigue[i] = np.random.choice([0, 1], p=[0.4, 0.6])
            mood_swings[i] = np.random.choice([0, 1], p=[0.35, 0.65])
            pelvic_pain[i] = np.random.choice([0, 1], p=[0.5, 0.5])
            infertility[i] = np.random.choice([0, 1], p=[0.4, 0.6])
            
            # Increase weight and biomarkers for PCOS positive patients
            weight[i] = weight[i] + np.random.uniform(10, 30)
            lh[i] = lh[i] * np.random.uniform(1.5, 2.5)
            amh[i] = amh[i] + np.random.uniform(3.0, 10.0)
            testosterone[i] = testosterone[i] + np.random.uniform(30, 80)
            fasting_insulin[i] = fasting_insulin[i] + np.random.uniform(10, 25)
            blood_glucose[i] = blood_glucose[i] + np.random.uniform(10, 40)
        else:
            hirsutism[i] = np.random.choice([0, 1], p=[0.9, 0.1])
            acne[i] = np.random.choice([0, 1], p=[0.75, 0.25])
            hair_loss[i] = np.random.choice([0, 1], p=[0.85, 0.15])
            dark_patches[i] = np.random.choice([0, 1], p=[0.92, 0.08])
            weight_gain[i] = np.random.choice([0, 1], p=[0.8, 0.2])
            difficulty_losing_weight[i] = np.random.choice([0, 1], p=[0.85, 0.15])
            fatigue[i] = np.random.choice([0, 1], p=[0.7, 0.3])
            mood_swings[i] = np.random.choice([0, 1], p=[0.7, 0.3])
            pelvic_pain[i] = np.random.choice([0, 1], p=[0.85, 0.15])
            infertility[i] = np.random.choice([0, 1], p=[0.9, 0.1])
            
    # Recalculate BMI based on adjusted weights
    bmi = weight / ((height / 100) ** 2)
    
    # Store everything in a pandas DataFrame
    df = pd.DataFrame({
        'Age': age,
        'Height': np.round(height, 1),
        'Weight': np.round(weight, 1),
        'BMI': np.round(bmi, 2),
        'CycleRegularity': cycle_regularity,
        'CycleLength': np.round(cycle_length, 1),
        'CyclePeriod': cycle_period,
        'Hirsutism': hirsutism,
        'Acne': acne,
        'HairLoss': hair_loss,
        'DarkPatches': dark_patches,
        'WeightGain': weight_gain,
        'DifficultyLosingWeight': difficulty_losing_weight,
        'Fatigue': fatigue,
        'MoodSwings': mood_swings,
        'PelvicPain': pelvic_pain,
        'Infertility': infertility,
        'FamilyHistory': family_history,
        'PhysicalActivity': physical_activity,
        'StressLevel': stress_level,
        'SleepDuration': np.round(sleep_duration, 1),
        'FSH': np.round(fsh, 2),
        'LH': np.round(lh, 2),
        'AMH': np.round(amh, 2),
        'Testosterone': np.round(testosterone, 2),
        'FastingInsulin': np.round(fasting_insulin, 2),
        'BloodGlucose': np.round(blood_glucose, 2),
        'PCOS': pcos
    })
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname('backend/pcod_dataset.csv'), exist_ok=True)
    df.to_csv('backend/pcod_dataset.csv', index=False)
    print(f"Generated dataset with {n_samples} samples. PCOS positive: {df['PCOS'].sum()}")
    return df

if __name__ == "__main__":
    generate_pcos_dataset()
