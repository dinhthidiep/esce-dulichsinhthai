namespace ESCE_SYSTEM.Options
{
    public class JwtSetting
    {
        public string Key { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public int ExpirationMinutes { get; set; }
        public string GoogleClientID { get; set; }
    }
}
