import numpy as np
import pandas as pd
import os

def generate_pcos_dataset(n_samples=2000, random_state=42):
    np.random.seed(random_state)
    
    # 1. Demographics
    age = np.random.randint(15, 45, size=n_samples)
    height = np.random.uniform(145, 175, size=n_samples) # in cm
    weight = np.random.uniform(45, 105, size=n_samples) # in kg
    bmi = weight / ((height / 100) ** 2)
    
    # 2. Cycle Information
    cycle_regularity = np.random.choice([0, 1], size=n_samples, p=[0.65, 0.35]) # 1 = irregular
    cycle_length = np.where(cycle_regularity == 1, np.random.uniform(35, 60, size=n_samples), np.random.uniform(25, 34, size=n_samples))
    cycle_period = np.random.randint(3, 9, size=n_samples)
    
    # 3. Clinical Symptoms
    hirsutism = np.random.choice([0, 1], size=n_samples, p=[0.75, 0.25])
    acne = np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3])
    hair_loss = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
    dark_patches = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])
    weight_gain = np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3])
    difficulty_losing_weight = np.random.choice([0, 1], size=n_samples, p=[0.75, 0.25])
    fatigue = np.random.choice([0, 1], size=n_samples, p=[0.65, 0.35])
    mood_swings = np.random.choice([0, 1], size=n_samples, p=[0.65, 0.35])
    pelvic_pain = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
    infertility = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])
    
    family_history = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
    physical_activity = np.random.choice([1, 2, 3], size=n_samples, p=[0.4, 0.4, 0.2])
    stress_level = np.random.randint(1, 11, size=n_samples)
    sleep_duration = np.random.uniform(5, 9, size=n_samples)
    
    # 4. Hormones & Lab Tests
    fsh = np.random.uniform(2.5, 10.0, size=n_samples)
    lh = np.random.uniform(2.5, 18.0, size=n_samples)
    lh_fsh_ratio = lh / fsh
    amh = np.random.uniform(1.0, 9.0, size=n_samples)
    testosterone = np.random.uniform(15.0, 85.0, size=n_samples)
    fasting_insulin = np.random.uniform(3.0, 30.0, size=n_samples)
    blood_glucose = np.random.uniform(70.0, 135.0, size=n_samples)
    
    # 5. Risk score formula based on Rotterdam & AE-PCOS clinical criteria
    log_odds = (
        -7.0 # intercept
        + 2.0 * cycle_regularity
        + 1.2 * (cycle_length > 35).astype(int)
        + 1.4 * hirsutism
        + 1.0 * acne
        + 0.9 * hair_loss
        + 1.0 * dark_patches
        + 0.9 * weight_gain
        + 0.9 * difficulty_losing_weight
        + 1.0 * (bmi >= 25).astype(int)
        + 1.0 * (bmi >= 30).astype(int)
        + 1.5 * (lh_fsh_ratio >= 1.8).astype(int)
        + 1.4 * (amh >= 4.5).astype(int)
        + 1.2 * (testosterone >= 45.0).astype(int)
        + 1.0 * (fasting_insulin >= 15.0).astype(int)
        + 0.8 * family_history
        + 0.05 * stress_level
        - 0.2 * (physical_activity - 1)
        + np.random.normal(0, 0.5, size=n_samples)
    )
    
    prob = 1 / (1 + np.exp(-log_odds))
    pcos = (prob >= 0.5).astype(int)
    
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
    
    os.makedirs('backend', exist_ok=True)
    df.to_csv('backend/pcod_dataset.csv', index=False)
    print(f"Generated dataset with {n_samples} samples. PCOS positive: {df['PCOS'].sum()}")
    return df

if __name__ == "__main__":
    generate_pcos_dataset()
