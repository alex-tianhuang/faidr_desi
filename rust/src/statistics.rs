/// Compute the mean and sample standard deviation.
/// 
/// Returns the `n-1` sample estimate.
pub fn mean_and_sample_std(count: u32, sum: f32, sum_of_squares: f32) -> (f32, f32) {
    let mean = sum / count as f32;
    let variance = (sum_of_squares - sum * mean) / (count - 1) as f32;
    (mean, variance.sqrt())
}
/// Compute the pearson correlation.
/// 
/// The variable names are under the convention that one is
/// taking the correlations of variables `i` and `j`.
/// "Joint" means only allowing samples where both variables
/// are defined for that sample (so the joint sum of variable `i`
/// cannot use any samples for which the variable `j` was not
/// defined, and same for vice versa).
pub fn pearson_correlation(
    joint_count: u32,
    joint_sum_i: f32,
    joint_sum_j: f32,
    sum_product_ij: f32,
    joint_sum_squared_i: f32,
    joint_sum_squared_j: f32,
) -> f32 {
    let numerator = joint_count as f32 * sum_product_ij - joint_sum_i * joint_sum_j;
    let denominator_squared = (joint_count as f32 * joint_sum_squared_i
        - joint_sum_i * joint_sum_i)
        * (joint_count as f32 * joint_sum_squared_j - joint_sum_j * joint_sum_j);
    numerator / denominator_squared.sqrt()
}
