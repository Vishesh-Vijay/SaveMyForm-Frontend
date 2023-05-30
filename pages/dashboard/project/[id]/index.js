import React, { useState, useEffect } from 'react';
import { Typography, Col, Row, Button, Input, Modal, message } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ProjectItem from '../../../../components/elements/ProjectItem';
import { AiOutlineDelete } from 'react-icons/ai';
import { get, remove } from '../../../../components/utils/API';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRouter } from 'next/router';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useWindowSize } from '../../../../components/utils/hooks/useWindowSize';
import { useQuery, dehydrate } from '@tanstack/react-query';
import Loader from '../../../../components/elements/Loader';
import Form from '../../../../components/elements/Form';
import Footer from '../../../../components/elements/Footer';
async function getProjectData(id) {
  return await get(`/project/dashboard/${id}`).then((data) => {
    data?.data?.data?.forms?.forEach((form) => {
      let iostr = form.date_created;
      let iostr2 = form.last_updated;
      let tempDate = new Date(iostr).toDateString().slice(4);
      let tempDate2 = new Date(iostr2).toDateString().slice(4);
      form.date_created = tempDate.slice(0, 6) + ',' + tempDate.slice(6);
      form.last_updated = tempDate2.slice(0, 6) + ',' + tempDate2.slice(6);
    });
    return data?.data?.data;
  });
}

export default function Project({ id }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProjectPassword, setDeleteProjectPassword] = useState('');

  const projectQuery = useQuery({
    queryKey: ['projectData', id],
    queryFn: () => {
      return getProjectData(id);
    },
    staleTime: 10 * 60 * 1000,
  });
  const showModal = () => {
    setIsModalOpen(true);
  };

  //need to fix some issues in this.
  const handleOk = async () => {
    // write send request here
    const token = await executeRecaptcha();
    if (!token) {
      // setResponse({ message: "Failed to Send!!!", status: "Failed" });
      //message error
      message.error('Recaptcha Failed');
      return;
    }
    const query = {
      recaptcha_token: token,
      password: deleteProjectPassword,
    };
    remove(`/project/delete/${id}`, query)
      .then((res) => {
        console.log(res);
        if (res.status === 'OK') {
          queryClient.invalidateQueries(['userData']);
          setDeleteProjectPassword('');
          setIsModalOpen(false);
          router.replace('/dashboard');
        } else {
          message.error(res.error);
        }
      })
      .catch((err) => {
        message.error(err.message);
      });
  };

  const handleCancel = () => {
    setDeleteProjectPassword('');
    //
    setIsModalOpen(false);
  };

  //Function to get screen size as the component is rendered on server side but we need the screen size of the user
  const size = useWindowSize();

  // if (projectQuery?.isLoading) return <Loader />;
  // if (projectQuery?.isSuccess) {
  // console.log(queryClient.getQueryData(["userData"]));
  return (
    <>
      {/* <div
          className={`${
            size.width <= 800 ? 'h-fit' : 'h-[13rem]'
          }  mt-8 pt-4 w-[90%] rounded-lg bg-[#FFFEFE] mx-auto shadow-[0_4px_4px_0px_#00000040] border-[#E7EEEC] border-2`}
        >
          <Modal
            open={isModalOpen}
            onOk={handleOk}
            okText="Confirm"
            onCancel={handleCancel}
          >
            <div className="py-4 text-lg font-[Poppins] font-normal">
              Are you sure you want to delete the project?
            </div>
            <Input
              className="rounded-lg"
              placeholder="Enter Password"
              type="password"
              onChange={(e) => {
                setDeleteProjectPassword(e.target.value);
              }}
            />
          </Modal>
          <Row>
            <Col flex="none" className="pl-8">
              <Col className="justify-start">
                <Typography.Title
                  level={3}
                  className=" mb-2 text-4xl font-inter font-medium text-left"
                >
                  {projectQuery.data?.name}
                </Typography.Title>
              </Col>
              <Col className="justify-start">
                <Typography.Title
                  level={5}
                  className=" mb-0 text-2xl font-normal text-[#001E2B] text-left"
                >
                  {projectQuery.data?.owner?.name} (
                  {projectQuery.data?.owner?.email})
                </Typography.Title>
              </Col>
              <Col className="justify-start">
                <Typography.Title
                  level={5}
                  className="mb-0 text-2xl font-normal text-[#001E2B] text-left "
                >
                
                  Collaborators:{' '}
                  {projectQuery.data?.collaborators?.map(
                    (collaborator, index) => {
                      <span
                        className="hover:underline text-xl font-normal text-[#006DFB] text-left"
                        key={index}
                      >
                        {collaborator}
                        {index !== projectQuery.data?.collaborators?.length - 1
                          ? ' ,'
                          : null}
                      </span>;
                    },
                  )}
                </Typography.Title>
              </Col>
              <Col className="justify-start">
                <Typography.Title
                  level={5}
                  className="text-2xl font-normal text-[#001E2B] text-left mb-0"
                >
                  Allowed Origins:{' '}
                  {projectQuery.data?.allowedOrigins?.map((origin, index) => {
                    return (
                      <span
                        className="hover:underline text-xl font-medium text-[#970606] text-left mr-2"
                        key={index}
                      >
                        {origin}
                        {index !== projectQuery.data?.allowedOrigins?.length - 1
                          ? ' ,'
                          : null}
                      </span>
                    );
                  })}
                </Typography.Title>
                <Typography.Title
                  level={5}
                  className="text-2xl font-normal text-[#001E2B] text-left mt-0"
                >
                  reCAPTCHA:{' '}
                  <span className="hover:underline text-xl font-medium text-[#00694B] text-left">
                    {projectQuery.data?.hasRecaptcha
                      ? 'Available'
                      : 'Unavailable'}
                  </span>
                </Typography.Title>
              </Col>
            </Col>
            {size.width > 800 && (
              <>
                <Col flex="24">
                  <Button className="pb-2 text-2xl absolute right-16 mx-4 h-14 w-14  border-[#00694B] text-[#00694B] font-medium font-inter mb-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300">
                    <EditOutlined />
                  </Button>
                  <Button
                    className="absolute right-0 border-[#970606] text-[#970606] mx-4 h-14 w-14 font-medium font-inter text-xl mb-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-red-300"
                    onClick={showModal}
                  >
                    <AiOutlineDelete className="h-6 w-6" />
                  </Button>
                </Col>
              </>
            )}
          </Row>
          {size.width <= 800 && (
            <>
              <Row>
                <Col>
                  <Button className="pt-0 pb-2 pl-3 text-xl ml-8 my-4  h-10 w-12  border-[#00694B] text-[#00694B] font-medium font-inter  rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300">
                    <EditOutlined />
                  </Button>
                </Col>
                <Col>
                  <Button
                    className=" mr-8 ml-4 h-10 w-13  border-[#970606] text-[#970606] font-medium font-inter text-xl my-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-red-300"
                    onClick={showModal}
                  >
                    <AiOutlineDelete className="" />
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </div>
        <div className="w-[90%] min-h-[15rem] pb-4 rounded-lg bg-[#FFFEFE] mx-auto shadow-[0_4px_4px_0px_#00000040] my-12 border-[#E7EEEC] border-2">
          <Row>
            <Col flex="4" className="mt-3 mb-0">
              <Typography.Text
                level={3}
                className="mb-0 text-4xl font-inter font-medium ml-8"
              >
                Forms {`(${projectQuery.data?.form_count || 0})`}
              </Typography.Text>

              <a className="mx-5 mt-8 text-[#006DFB]">Docs</a>
            </Col>
            {size.width > 800 && (
              <>
                <Col flex="1">
                  <Button
                    className="absolute right-0 h-12 w-12  border-[#00694B] border-2 text-[#00694B] font-medium font-inter text-xl mt-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300"
                    onClick={(e) => {
                      projectQuery.refetch();
                    }}
                  >
                    <ReloadOutlined className="mb-[5px] ml-[-3px]" />
                  </Button>
                </Col>
                <Col flex="1">
                  <Button
                    type="primary"
                    className="ml-5 mr-8 h-12 w-[16.25rem]  border-[#00694B] border-2 text-[#FFFEFE] font-medium font-inter text-xl mt-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300"
                    onClick={() =>
                      router.push(`/dashboard/project/${id}/newform`)
                    }
                  >
                    Create Form
                  </Button>
                </Col>{' '}
              </>
            )}
          </Row>
          {size.width <= 800 && (
            <>
              <Row>
                <Col>
                  <Button
                    className="ml-8 h-12 w-12  border-[#00694B] border-2 text-[#00694B] font-medium font-inter text-xl mt-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300"
                    onClick={(e) => {
                      projectQuery.refetch();
                    }}
                  >
                    <ReloadOutlined className="mb-[5px] ml-[-3px]" />
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    className="ml-5 mr-6 h-12 w-[16.25rem]  border-[#00694B] border-2 text-[#FFFEFE] font-medium font-inter text-xl mt-4 rounded-lg hover:border-green-300] shadow-md hover:shadow-green-300"
                    onClick={() =>
                      router.push(`/dashboard/project/${id}/newform`)
                    }
                  >
                    Create Form
                  </Button>
                </Col>
              </Row>
            </>
          )}
          <Row span={22}>
            <Input
              className="w-[95%] mx-auto mt-5 border-2 border-[#C2C8CB] text-[#C2CBCB] rounded-lg font-inter font-medium text-lg"
              size="large"
              placeholder="Find forms by name"
              prefix={<SearchOutlined className="mr-4" />}
            />
          </Row>
          <div className="border-[#C@CBCB] border-[1px] mt-8"></div>
          <div className="width-[100%] overflow-x-auto">
            <div className="min-w-[768px]">
              <Row className="mt-3 mb-2">
                <Col
                  span={6}
                  className="pl-10 pr-8 font-inter font-semibold text-base"
                >
                  Name
                </Col>
                <Col
                  span={6}
                  className="px-8 font-inter font-semibold text-base"
                >
                  Number of Submissions
                </Col>
                <Col
                  span={6}
                  className="px-8 font-inter font-semibold text-base"
                >
                  Last Submission
                </Col>
                <Col
                  span={6}
                  className="px-8 font-inter font-semibold text-base"
                >
                  Date Created
                </Col>
              </Row>
              <div className="border-[#C@CBCB] border-[1px]"></div>

           
              {projectQuery.isFetching ? (
                <div className=" relative min-h-[20vh]">
                  <Loader />
                </div>
              ) : (
                projectQuery.data?.forms?.map((form, i) => {
                  return (
                    <ProjectItem
                      key={i}
                      name={form.name}
                      numberOfForms={form.submission_count}
                      allowedOrigin={form.last_updated}
                      dateCreated={form.date_created}
                      baseurl={`/dashboard/project/${id}`}
                      id={form.id}
                    />
                  );
                })
              )}
          
            </div>
          </div>
        </div> */}
      <div>
        <div className="relative">
          <svg
            className="w-full"
            viewBox="0 0 1728 461"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clip-path="url(#clip0_1604_86)">
              <path
                d="M1727.5 0.5H0.5V460.5H1727.5V0.5Z"
                fill="#023430"
                stroke="black"
              />
              <path
                d="M1628 0C1683.23 0 1728 44.7715 1728 100V324.686C1728 381.743 1673.73 423.166 1618.69 408.114C1596.62 402.076 1573.05 405.034 1553.15 416.338L1515 438.01L1476.2 453.704C1464.29 458.523 1451.56 461 1438.7 461H848.104C817.685 461 791.595 439.298 786.055 409.387C785.353 405.597 785 401.75 785 397.896V394.527C785 339.415 829.677 294.738 884.79 294.738H1098.52H1164.22C1240.12 294.738 1283.43 208.075 1237.87 147.369C1192.31 86.6627 1235.63 0 1311.53 0H1628Z"
                fill="#00684A"
              />
            </g>
            <defs>
              <clipPath id="clip0_1604_86">
                <rect width="1728" height="461" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className=" absolute top-[80px] left-1/2 transform -translate-x-1/2 md:left-1/3 md:-translate-x-1/3 flex-row md:justify-around md:flex justify-between items-center">
            <h1 className=" text-[#DEF7E5] font-bold text-[48px]">Project1</h1>
            <button className="text-[#DEF7E5] mt-2 md:mt-0 ml-12 md:ml-8 h-[31px] px-2 rounded-lg border-2 border-[#DEF7E5] ">
              Manage
            </button>
          </div>
          <div className="absolute top-[191px] left-1/2 transform -translate-x-1/2 md:left-3/4 md:-translate-x-3/4 mt-8">
            <button className=" flex text-[#00694B] font-semibold rounded-md px-2 py-1 bg-[#92E3A9] items-center justify-around mr-4  md:mr-20">
              <PlusOutlined className="mr-1" />
              Create a form
            </button>
          </div>
          <div className="flex-row">
            <div className="absolute left-1/2 transform -translate-x-1/2 top-[250px] md:top-[262px] mt-4 flex-row">
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
              <Form createdAt={'3'} formName={'Form1'} totalSubmissions={8} />
            </div>
          </div>
        </div>
      </div>
       
    </>
  );
  //   }
  // }
  // export async function getServerSideProps({ params: { id } }) {
  //   const queryClient = new QueryClient();
  //   await queryClient.fetchQuery(['projectData', id], getProjectData);
  //   return {
  //     props: {
  //       dehydratedState: dehydrate(queryClient),
  //       id,
  //     },
  //   };
}
