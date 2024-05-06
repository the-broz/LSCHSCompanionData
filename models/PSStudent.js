/** 
 * A PowerSchool student.
 * @hideconstructor
*/
class PSStudent {
    constructor(studentID){
        /**
         * The student ID.
         * @member {number}
         */
        this.studentID = studentID
    }
    /**
     * Gets the schedule of this student.
     * @return {Array}
     */
    getTodaySchedule(termID){
        // Get student schedule from database
        // TODO: Implement this function
        
    }
}

module.exports = PSStudent