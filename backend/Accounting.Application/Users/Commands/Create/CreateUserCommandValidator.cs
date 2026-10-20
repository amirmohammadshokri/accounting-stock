using FluentValidation;

namespace Accounting.Application.Users.Commands.Create;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("نام الزامی است.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("نام خانوادگی الزامی است.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("ایمیل الزامی است.")
            .EmailAddress().WithMessage("قالب ایمیل معتبر نیست.")
            .MaximumLength(255);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("رمز عبور الزامی است.")
            .MinimumLength(8).WithMessage("رمز عبور باید حداقل ۸ نویسه داشته باشد.")
            .Matches(@"[A-Z]").WithMessage("رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.")
            .Matches(@"[a-z]").WithMessage("رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد.")
            .Matches(@"[0-9]").WithMessage("رمز عبور باید حداقل یک رقم داشته باشد.");

        RuleFor(x => x.RoleIds)
            .NotEmpty().WithMessage("انتخاب حداقل یک نقش الزامی است.");
    }
}
