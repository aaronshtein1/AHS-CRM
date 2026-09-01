export interface ICD10Code {
  code: string;
  category: string;
  description: string;
}

export const TOP_75_ICD10_CODES: ICD10Code[] = [
  // Traumatic Brain Injury (TBI)
  { code: 'S06.9X0A', category: 'Traumatic Brain Injury', description: 'Unspecified intracranial injury without loss of consciousness, initial encounter' },
  { code: 'S06.2X0A', category: 'Traumatic Brain Injury', description: 'Diffuse traumatic brain injury without loss of consciousness, initial encounter' },
  { code: 'S06.300A', category: 'Traumatic Brain Injury', description: 'Unspecified focal traumatic brain injury without loss of consciousness, initial encounter' },
  { code: 'S06.5X0A', category: 'Traumatic Brain Injury', description: 'Traumatic subdural hemorrhage without loss of consciousness, initial encounter' },
  { code: 'S06.6X0A', category: 'Traumatic Brain Injury', description: 'Traumatic subarachnoid hemorrhage without loss of consciousness, initial encounter' },
  { code: 'T90.5XXA', category: 'Traumatic Brain Injury', description: 'Sequelae of intracranial injury, initial encounter' },
  { code: 'Z87.820', category: 'Traumatic Brain Injury', description: 'Personal history of traumatic brain injury' },

  // Dementia & Neurodegenerative
  { code: 'G30.9', category: 'Dementia & Neurology', description: 'Alzheimer\'s disease, unspecified' },
  { code: 'G30.1', category: 'Dementia & Neurology', description: 'Alzheimer\'s disease with late onset' },
  { code: 'F03.90', category: 'Dementia & Neurology', description: 'Unspecified dementia, without behavioral disturbance' },
  { code: 'F03.91', category: 'Dementia & Neurology', description: 'Unspecified dementia, with behavioral disturbance' },
  { code: 'F01.50', category: 'Dementia & Neurology', description: 'Vascular dementia, without behavioral disturbance' },
  { code: 'F02.80', category: 'Dementia & Neurology', description: 'Dementia in other diseases classified elsewhere, without behavioral disturbance' },
  { code: 'G31.83', category: 'Dementia & Neurology', description: 'Dementia with Lewy bodies' },
  { code: 'G31.09', category: 'Dementia & Neurology', description: 'Other frontotemporal dementia' },

  // Cerebrovascular (Stroke / CVA)
  { code: 'I69.30', category: 'Stroke & Cerebrovascular', description: 'Unspecified sequelae of cerebral infarction (Stroke / CVA)' },
  { code: 'I69.351', category: 'Stroke & Cerebrovascular', description: 'Hemiplegia and hemiparesis following cerebral infarction affecting right dominant side' },
  { code: 'I69.354', category: 'Stroke & Cerebrovascular', description: 'Hemiplegia and hemiparesis following cerebral infarction affecting left non-dominant side' },
  { code: 'I69.320', category: 'Stroke & Cerebrovascular', description: 'Aphasia following cerebral infarction' },
  { code: 'I69.321', category: 'Stroke & Cerebrovascular', description: 'Dysphasia following cerebral infarction' },
  { code: 'I69.398', category: 'Stroke & Cerebrovascular', description: 'Other sequelae of cerebral infarction' },
  { code: 'I63.9', category: 'Stroke & Cerebrovascular', description: 'Cerebral infarction, unspecified' },

  // Movement & Neurological Disorders
  { code: 'G20', category: 'Neurological Disorders', description: 'Parkinson\'s disease' },
  { code: 'G35', category: 'Neurological Disorders', description: 'Multiple sclerosis' },
  { code: 'G12.21', category: 'Neurological Disorders', description: 'Amyotrophic lateral sclerosis (ALS)' },
  { code: 'G81.90', category: 'Paralysis & Plegia', description: 'Hemiplegia, unspecified affecting unspecified side' },
  { code: 'G81.91', category: 'Paralysis & Plegia', description: 'Hemiplegia, unspecified affecting right dominant side' },
  { code: 'G81.94', category: 'Paralysis & Plegia', description: 'Hemiplegia, unspecified affecting left non-dominant side' },
  { code: 'G82.20', category: 'Paralysis & Plegia', description: 'Paraplegia, unspecified' },
  { code: 'G82.50', category: 'Paralysis & Plegia', description: 'Quadriplegia, unspecified' },
  { code: 'G40.909', category: 'Neurological Disorders', description: 'Epilepsy, unspecified, not intractable, without status epilepticus' },
  { code: 'G50.0', category: 'Neurological Disorders', description: 'Trigeminal neuralgia' },

  // Mobility & Gait Deficits
  { code: 'R26.89', category: 'Gait & Mobility', description: 'Other abnormalities of gait and mobility' },
  { code: 'R26.2', category: 'Gait & Mobility', description: 'Difficulty in walking, not elsewhere classified' },
  { code: 'R26.81', category: 'Gait & Mobility', description: 'Unsteadiness on feet' },
  { code: 'R26.0', category: 'Gait & Mobility', description: 'Ataxic gait' },
  { code: 'R29.6', category: 'Gait & Mobility', description: 'Repeated falls' },
  { code: 'M62.81', category: 'Musculoskeletal', description: 'Muscle weakness (generalized)' },

  // Caregiver Assistance & Functional Dependency
  { code: 'Z74.09', category: 'Functional Dependency', description: 'Other reduced mobility (Caregiver Assistance / Bedridden)' },
  { code: 'Z74.01', category: 'Functional Dependency', description: 'Bed confinement status' },
  { code: 'Z74.1', category: 'Functional Dependency', description: 'Need for assistance with personal care' },
  { code: 'Z74.2', category: 'Functional Dependency', description: 'Need for assistance at home and no other household member able to render care' },
  { code: 'Z74.3', category: 'Functional Dependency', description: 'Need for continuous supervision' },
  { code: 'Z74.8', category: 'Functional Dependency', description: 'Other problems related to care provider dependency' },

  // Geriatric & Age-Related Conditions
  { code: 'R54', category: 'Geriatric & Debility', description: 'Age-related physical debility / Frailty' },
  { code: 'R53.81', category: 'Geriatric & Debility', description: 'Other malaise / Chronic fatigue' },
  { code: 'R53.83', category: 'Geriatric & Debility', description: 'Other fatigue' },
  { code: 'R41.81', category: 'Cognitive Deficits', description: 'Age-related cognitive decline' },
  { code: 'R41.841', category: 'Cognitive Deficits', description: 'Cognitive deficit following cerebrovascular disease' },
  { code: 'R41.840', category: 'Cognitive Deficits', description: 'Attention and concentration deficit' },

  // Arthritis & Musculoskeletal
  { code: 'M19.90', category: 'Musculoskeletal', description: 'Unspecified osteoarthritis, unspecified site' },
  { code: 'M17.9', category: 'Musculoskeletal', description: 'Osteoarthritis of knee, unspecified' },
  { code: 'M16.9', category: 'Musculoskeletal', description: 'Osteoarthritis of hip, unspecified' },
  { code: 'M54.50', category: 'Musculoskeletal', description: 'Low back pain, unspecified' },
  { code: 'M81.0', category: 'Musculoskeletal', description: 'Age-related osteoporosis without current pathological fracture' },

  // Chronic Systemic & Cardiovascular
  { code: 'I10', category: 'Cardiovascular', description: 'Essential (primary) hypertension' },
  { code: 'I50.9', category: 'Cardiovascular', description: 'Heart failure, unspecified' },
  { code: 'I50.22', category: 'Cardiovascular', description: 'Chronic systolic (congestive) heart failure' },
  { code: 'I50.32', category: 'Cardiovascular', description: 'Chronic diastolic (congestive) heart failure' },
  { code: 'I25.10', category: 'Cardiovascular', description: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'I48.91', category: 'Cardiovascular', description: 'Unspecified atrial fibrillation' },
  { code: 'E11.9', category: 'Endocrine & Metabolic', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E11.40', category: 'Endocrine & Metabolic', description: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified' },
  { code: 'E11.51', category: 'Endocrine & Metabolic', description: 'Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene' },
  { code: 'E78.5', category: 'Endocrine & Metabolic', description: 'Hyperlipidemia, unspecified' },
  { code: 'E03.9', category: 'Endocrine & Metabolic', description: 'Hypothyroidism, unspecified' },
  { code: 'N18.9', category: 'Renal', description: 'Chronic kidney disease, unspecified' },
  { code: 'N18.30', category: 'Renal', description: 'Chronic kidney disease, stage 3, unspecified' },
  { code: 'J44.9', category: 'Pulmonary', description: 'Chronic obstructive pulmonary disease (COPD), unspecified' },

  // Psychiatric & Behavioral
  { code: 'F41.1', category: 'Psychiatric', description: 'Generalized anxiety disorder' },
  { code: 'F32.9', category: 'Psychiatric', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'F33.9', category: 'Psychiatric', description: 'Major depressive disorder, recurrent, unspecified' },
  { code: 'F43.10', category: 'Psychiatric', description: 'Post-traumatic stress disorder, unspecified' },
  { code: 'F84.0', category: 'Developmental', description: 'Autistic disorder' },
  { code: 'F79', category: 'Developmental', description: 'Unspecified intellectual disabilities' },
  { code: 'H54.0', category: 'Sensory Impairment', description: 'Blindness, both eyes' },
  { code: 'H91.90', category: 'Sensory Impairment', description: 'Unspecified hearing loss, unspecified ear' }
];
