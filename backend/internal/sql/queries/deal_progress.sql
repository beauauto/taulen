-- name: GetDealProgressByDealID :one
SELECT id, deal_id, section_1a_complete, section_1b_complete, section_1c_complete,
    section_1d_complete, section_1e_complete, section_2a_complete, section_2b_complete,
    section_2c_complete, section_2d_complete, section_3_complete, section_4_complete,
    section_5_complete, section_6_complete, section_7_complete, section_8_complete,
    section_9_complete, lender_l1_complete, lender_l2_complete, lender_l3_complete,
    lender_l4_complete, continuation_complete, unmarried_addendum_complete,
    progress_percentage, last_updated_section, last_updated_at, progress_notes,
    created_at, updated_at
FROM deal_progress
WHERE deal_id = $1 LIMIT 1;

-- name: UpdateDealProgressSection :exec
UPDATE deal_progress
SET 
    section_1a_complete = CASE WHEN $2 = 'Section1a_PersonalInfo' THEN $3 ELSE section_1a_complete END,
    section_1b_complete = CASE WHEN $2 = 'Section1b_CurrentEmployment' THEN $3 ELSE section_1b_complete END,
    section_1c_complete = CASE WHEN $2 = 'Section1c_AdditionalEmployment' THEN $3 ELSE section_1c_complete END,
    section_1d_complete = CASE WHEN $2 = 'Section1d_PreviousEmployment' THEN $3 ELSE section_1d_complete END,
    section_1e_complete = CASE WHEN $2 = 'Section1e_OtherIncome' THEN $3 ELSE section_1e_complete END,
    section_2a_complete = CASE WHEN $2 = 'Section2a_Assets' THEN $3 ELSE section_2a_complete END,
    section_2b_complete = CASE WHEN $2 = 'Section2b_OtherAssetsCredits' THEN $3 ELSE section_2b_complete END,
    section_2c_complete = CASE WHEN $2 = 'Section2c_Liabilities' THEN $3 ELSE section_2c_complete END,
    section_2d_complete = CASE WHEN $2 = 'Section2d_Expenses' THEN $3 ELSE section_2d_complete END,
    section_3_complete = CASE WHEN $2 = 'Section3_RealEstateOwned' THEN $3 ELSE section_3_complete END,
    section_4_complete = CASE WHEN $2 = 'Section4_LoanPropertyInfo' THEN $3 ELSE section_4_complete END,
    section_5_complete = CASE WHEN $2 = 'Section5_Declarations' THEN $3 ELSE section_5_complete END,
    section_6_complete = CASE WHEN $2 = 'Section6_Acknowledgments' THEN $3 ELSE section_6_complete END,
    section_7_complete = CASE WHEN $2 = 'Section7_MilitaryService' THEN $3 ELSE section_7_complete END,
    section_8_complete = CASE WHEN $2 = 'Section8_Demographics' THEN $3 ELSE section_8_complete END,
    section_9_complete = CASE WHEN $2 = 'Section9_OriginatorInfo' THEN $3 ELSE section_9_complete END,
    lender_l1_complete = CASE WHEN $2 = 'Lender_L1_PropertyLoanInfo' THEN $3 ELSE lender_l1_complete END,
    lender_l2_complete = CASE WHEN $2 = 'Lender_L2_TitleInfo' THEN $3 ELSE lender_l2_complete END,
    lender_l3_complete = CASE WHEN $2 = 'Lender_L3_MortgageLoanInfo' THEN $3 ELSE lender_l3_complete END,
    lender_l4_complete = CASE WHEN $2 = 'Lender_L4_Qualification' THEN $3 ELSE lender_l4_complete END,
    continuation_complete = CASE WHEN $2 = 'ContinuationSheet' THEN $3 ELSE continuation_complete END,
    unmarried_addendum_complete = CASE WHEN $2 = 'UnmarriedAddendum' THEN $3 ELSE unmarried_addendum_complete END,
    last_updated_section = $2::urla_section_enum,
    last_updated_at = CURRENT_TIMESTAMP
WHERE deal_id = $1;

-- name: UpdateDealProgressNotes :exec
UPDATE deal_progress
SET progress_notes = $2, updated_at = CURRENT_TIMESTAMP
WHERE deal_id = $1;
